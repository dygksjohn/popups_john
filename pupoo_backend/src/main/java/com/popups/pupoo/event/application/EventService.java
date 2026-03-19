package com.popups.pupoo.event.application;

import com.popups.pupoo.board.review.domain.enums.ReviewStatus;
import com.popups.pupoo.board.review.persistence.ReviewRepository;
import com.popups.pupoo.common.exception.BusinessException;
import com.popups.pupoo.common.exception.ErrorCode;
import com.popups.pupoo.event.domain.enums.EventStatus;
import com.popups.pupoo.event.domain.enums.RegistrationStatus;
import com.popups.pupoo.event.domain.model.Event;
import com.popups.pupoo.event.dto.ClosedEventAnalyticsResponse;
import com.popups.pupoo.event.dto.EventResponse;
import com.popups.pupoo.event.persistence.EventRegistrationRepository;
import com.popups.pupoo.event.persistence.EventRepository;
import com.popups.pupoo.program.persistence.ProgramRepository;
import com.popups.pupoo.qr.domain.enums.QrCheckType;
import com.popups.pupoo.qr.persistence.QrCheckinRepository;
import com.popups.pupoo.storage.support.StorageUrlResolver;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.util.List;

@Service
public class EventService {

    private final EventRepository eventRepository;
    private final ProgramRepository programRepository;
    private final EventRegistrationRepository eventRegistrationRepository;
    private final ReviewRepository reviewRepository;
    private final StorageUrlResolver storageUrlResolver;
    private final QrCheckinRepository qrCheckinRepository;

    public EventService(
            EventRepository eventRepository,
            ProgramRepository programRepository,
            EventRegistrationRepository eventRegistrationRepository,
            ReviewRepository reviewRepository,
            StorageUrlResolver storageUrlResolver,
            QrCheckinRepository qrCheckinRepository
    ) {
        this.eventRepository = eventRepository;
        this.programRepository = programRepository;
        this.eventRegistrationRepository = eventRegistrationRepository;
        this.reviewRepository = reviewRepository;
        this.storageUrlResolver = storageUrlResolver;
        this.qrCheckinRepository = qrCheckinRepository;
    }

    public Page<EventResponse> getEvents(
            Pageable pageable,
            String keyword,
            EventStatus status,
            LocalDateTime fromAt,
            LocalDateTime toAt
    ) {
        LocalDate today = LocalDate.now();
        List<Event> filtered = eventRepository.findAll(
                        Sort.by(Sort.Direction.DESC, "startAt").and(Sort.by(Sort.Direction.DESC, "eventId"))
                ).stream()
                .filter(event -> event.getStatus() != EventStatus.CANCELLED)
                .filter(event -> matchesKeyword(event, keyword))
                .filter(event -> matchesStartAtRange(event, fromAt, toAt))
                .filter(event -> status == null || resolvePublicStatus(event, today) == status)
                .toList();

        if (pageable.isUnpaged()) {
            return new PageImpl<>(filtered.stream().map(event -> toEventResponse(event, today)).toList());
        }

        int start = Math.toIntExact(pageable.getOffset());
        if (start >= filtered.size()) {
            return new PageImpl<>(List.of(), pageable, filtered.size());
        }

        int end = Math.min(start + pageable.getPageSize(), filtered.size());
        return new PageImpl<>(
                filtered.subList(start, end).stream().map(event -> toEventResponse(event, today)).toList(),
                pageable,
                filtered.size()
        );
    }

    public EventResponse getEvent(Long eventId) {
        Event event = eventRepository.findById(eventId)
                .orElseThrow(() -> new BusinessException(
                        ErrorCode.INVALID_REQUEST,
                        "존재하지 않는 행사입니다. eventId=" + eventId
                ));
        return toEventResponse(event, LocalDate.now());
    }

    public List<ClosedEventAnalyticsResponse> getClosedEventAnalytics() {
        LocalDate today = LocalDate.now();
        return eventRepository.findAll(
                        Sort.by(Sort.Direction.DESC, "startAt").and(Sort.by(Sort.Direction.DESC, "eventId"))
                ).stream()
                .filter(event -> event.getStatus() != EventStatus.CANCELLED)
                .filter(event -> resolvePublicStatus(event, today) == EventStatus.ENDED)
                .map(this::toClosedEventAnalyticsResponse)
                .toList();
    }

    private EventResponse toEventResponse(Event event) {
        return toEventResponse(event, LocalDate.now());
    }

    private EventResponse toEventResponse(Event event, LocalDate today) {
        EventResponse response = EventResponse.from(event, storageUrlResolver.toPublicUrl(event.getImageUrl()));
        response.setStatus(resolvePublicStatus(event, today));
        response.setTodayCheckinCount(countTodayCheckins(event.getEventId(), today));
        response.setTotalParticipantCount(countTotalParticipants(event));
        response.setPreRegistrationCount(countActivePreRegistrations(event.getEventId()));
        if (response.getImageUrl() == null) {
            response.setImageUrl(resolveEventThumbnail(event.getEventId()));
        }
        return response;
    }

    private long countTodayCheckins(Long eventId, LocalDate today) {
        if (eventId == null) {
            return 0L;
        }
        LocalDateTime from = LocalDateTime.of(today, LocalTime.MIN);
        LocalDateTime to = LocalDateTime.of(today, LocalTime.MAX);
        return qrCheckinRepository.countByQrCode_Event_EventIdAndCheckTypeAndCheckedAtBetween(
                eventId,
                QrCheckType.CHECKIN,
                from,
                to
        );
    }

    private long countActivePreRegistrations(Long eventId) {
        if (eventId == null) {
            return 0L;
        }
        long applied = eventRegistrationRepository.countByEventIdAndStatus(eventId, RegistrationStatus.APPLIED);
        long approved = eventRegistrationRepository.countByEventIdAndStatus(eventId, RegistrationStatus.APPROVED);
        return applied + approved;
    }

    private long countTotalParticipants(Event event) {
        if (event == null || event.getEventId() == null) {
            return 0L;
        }
        LocalDateTime from = event.getStartAt();
        if (from == null) {
            return qrCheckinRepository.countDistinctCheckinUsersByEventId(event.getEventId());
        }
        LocalDateTime now = LocalDateTime.now();
        LocalDateTime to = now.isBefore(from) ? from : now;
        return qrCheckinRepository.countDistinctCheckinUsersByEventIdBetween(
                event.getEventId(),
                from,
                to
        );
    }

    private String resolveEventThumbnail(Long eventId) {
        if (eventId == null) {
            return null;
        }
        return programRepository.findFirstByEventIdAndImageUrlIsNotNullOrderByProgramIdAsc(eventId)
                .map(program -> storageUrlResolver.toPublicUrl(program.getImageUrl()))
                .orElse(null);
    }

    private ClosedEventAnalyticsResponse toClosedEventAnalyticsResponse(Event event) {
        EventResponse eventResponse = toEventResponse(event);
        long participantCount = countTotalParticipants(event);
        long preRegistrationCount = countActivePreRegistrations(event.getEventId());
        int denominator = (int) Math.max(0L, Math.min(Integer.MAX_VALUE, preRegistrationCount));
        int participationRate = denominator > 0
                ? (int) Math.round((participantCount * 100.0) / denominator)
                : 0;
        Double averageRating = reviewRepository.findAverageRatingByEventIdAndReviewStatus(
                event.getEventId(),
                ReviewStatus.PUBLIC
        );
        long reviewCount = reviewRepository.countByEventIdAndDeletedFalseAndReviewStatus(
                event.getEventId(),
                ReviewStatus.PUBLIC
        );
        return ClosedEventAnalyticsResponse.from(
                eventResponse,
                participantCount,
                denominator,
                participationRate,
                averageRating == null ? 0.0 : Math.round(averageRating * 10.0) / 10.0,
                reviewCount
        );
    }

    private boolean matchesKeyword(Event event, String keyword) {
        if (keyword == null || keyword.isBlank()) {
            return true;
        }

        String normalizedKeyword = keyword.trim().toLowerCase();
        String eventName = event.getEventName() == null ? "" : event.getEventName().toLowerCase();
        String description = event.getDescription() == null ? "" : event.getDescription().toLowerCase();
        return eventName.contains(normalizedKeyword) || description.contains(normalizedKeyword);
    }

    private boolean matchesStartAtRange(Event event, LocalDateTime fromAt, LocalDateTime toAt) {
        LocalDateTime startAt = event.getStartAt();
        if (fromAt != null && (startAt == null || startAt.isBefore(fromAt))) {
            return false;
        }
        if (toAt != null && (startAt == null || startAt.isAfter(toAt))) {
            return false;
        }
        return true;
    }

    private EventStatus resolvePublicStatus(Event event, LocalDate today) {
        if (event.getStatus() == EventStatus.CANCELLED) {
            return EventStatus.CANCELLED;
        }

        LocalDate startDate = event.getStartAt() == null ? null : event.getStartAt().toLocalDate();
        LocalDate endDate = event.getEndAt() == null ? null : event.getEndAt().toLocalDate();

        if (startDate != null && startDate.isAfter(today)) {
            return EventStatus.PLANNED;
        }
        if (endDate != null && endDate.isBefore(today)) {
            return EventStatus.ENDED;
        }
        return EventStatus.ONGOING;
    }
}
