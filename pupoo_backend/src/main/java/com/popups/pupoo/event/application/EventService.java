package com.popups.pupoo.event.application;

import com.popups.pupoo.board.review.domain.enums.ReviewStatus;
import com.popups.pupoo.board.review.persistence.ReviewRepository;
import com.popups.pupoo.common.exception.BusinessException;
import com.popups.pupoo.common.exception.ErrorCode;
import com.popups.pupoo.common.util.PublicUrlNormalizer;
import com.popups.pupoo.event.domain.enums.EventStatus;
import com.popups.pupoo.event.domain.enums.RegistrationStatus;
import com.popups.pupoo.event.domain.model.Event;
import com.popups.pupoo.event.dto.ClosedEventAnalyticsResponse;
import com.popups.pupoo.event.dto.EventResponse;
import com.popups.pupoo.event.persistence.EventRegistrationRepository;
import com.popups.pupoo.event.persistence.EventRepository;
import com.popups.pupoo.program.persistence.ProgramRepository;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.List;

@Service
public class EventService {

    private static final int DEFAULT_EVENT_CAPACITY = 500;

    private final EventRepository eventRepository;
    private final ProgramRepository programRepository;
    private final EventRegistrationRepository eventRegistrationRepository;
    private final ReviewRepository reviewRepository;

    public EventService(
            EventRepository eventRepository,
            ProgramRepository programRepository,
            EventRegistrationRepository eventRegistrationRepository,
            ReviewRepository reviewRepository
    ) {
        this.eventRepository = eventRepository;
        this.programRepository = programRepository;
        this.eventRegistrationRepository = eventRegistrationRepository;
        this.reviewRepository = reviewRepository;
    }

    public Page<EventResponse> getEvents(
            Pageable pageable,
            String keyword,
            EventStatus status,
            LocalDateTime fromAt,
            LocalDateTime toAt
    ) {
        EventStatus safeStatus = (status == EventStatus.CANCELLED) ? null : status;
        return eventRepository.searchPublic(keyword, safeStatus, fromAt, toAt, pageable)
                .map(this::toEventResponse);
    }

    public EventResponse getEvent(Long eventId) {
        Event event = eventRepository.findById(eventId)
                .orElseThrow(() -> new BusinessException(
                        ErrorCode.INVALID_REQUEST,
                        "존재하지 않는 행사입니다. eventId=" + eventId
                ));
        return toEventResponse(event);
    }

    public List<ClosedEventAnalyticsResponse> getClosedEventAnalytics() {
        return eventRepository.searchPublic(
                        null,
                        EventStatus.ENDED,
                        null,
                        null,
                        Pageable.unpaged()
                )
                .stream()
                .map(this::toClosedEventAnalyticsResponse)
                .toList();
    }

    private EventResponse toEventResponse(Event event) {
        EventResponse response = EventResponse.from(event);
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
                .map(program -> PublicUrlNormalizer.normalize(program.getImageUrl()))
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
}
