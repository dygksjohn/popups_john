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
import com.popups.pupoo.storage.support.StorageUrlResolver;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;

/**
 * 공개 행사 조회와 종료 행사 분석용 조회를 담당한다.
 * 관리자 저장 상태를 그대로 노출하지 않고, 날짜 기준으로 공개용 `EventStatus`를 다시 계산한다.
 */
@Service
public class EventService {

    private static final int DEFAULT_EVENT_CAPACITY = 500;

    private final EventRepository eventRepository;
    private final ProgramRepository programRepository;
    private final EventRegistrationRepository eventRegistrationRepository;
    private final ReviewRepository reviewRepository;
    private final StorageUrlResolver storageUrlResolver;

    public EventService(
            EventRepository eventRepository,
            ProgramRepository programRepository,
            EventRegistrationRepository eventRegistrationRepository,
            ReviewRepository reviewRepository,
            StorageUrlResolver storageUrlResolver
    ) {
        this.eventRepository = eventRepository;
        this.programRepository = programRepository;
        this.eventRegistrationRepository = eventRegistrationRepository;
        this.reviewRepository = reviewRepository;
        this.storageUrlResolver = storageUrlResolver;
    }

    /**
     * 공개 행사 목록을 조회한다.
     * `CANCELLED`는 제외하고, 검색 조건과 날짜 범위를 적용한 뒤 공개 상태를 다시 계산해 응답한다.
     */
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

    /**
     * 공개 행사 단건을 조회한다.
     */
    public EventResponse getEvent(Long eventId) {
        Event event = eventRepository.findById(eventId)
                .orElseThrow(() -> new BusinessException(
                        ErrorCode.INVALID_REQUEST,
                        "존재하지 않는 행사입니다. eventId=" + eventId
                ));
        return toEventResponse(event, LocalDate.now());
    }

    /**
     * 종료된 행사만 분석 카드용 응답으로 변환한다.
     * 참여율은 승인된 신청 수와 기본 수용 인원 기준으로 계산한다.
     */
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
        if (response.getImageUrl() == null) {
            response.setImageUrl(resolveEventThumbnail(event.getEventId()));
        }
        return response;
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
        long participantCount = eventRegistrationRepository.countByEventIdAndStatus(
                event.getEventId(),
                RegistrationStatus.APPROVED
        );
        int participationRate = participantCount <= 0
                ? 0
                : Math.min((int) Math.round((participantCount * 100.0) / DEFAULT_EVENT_CAPACITY), 100);
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
                DEFAULT_EVENT_CAPACITY,
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

    /**
     * 관리자 저장 상태와 별도로 공개 화면용 상태를 계산한다.
     * 취소 행사는 그대로 유지하고, 그 외 행사는 현재 날짜가 시작 전인지 종료 후인지로 판단한다.
     */
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
