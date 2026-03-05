// file: src/main/java/com/popups/pupoo/event/application/EventService.java
package com.popups.pupoo.event.application;

import com.popups.pupoo.common.exception.BusinessException;
import com.popups.pupoo.common.exception.ErrorCode;
import com.popups.pupoo.event.domain.enums.EventStatus;
import com.popups.pupoo.event.domain.model.Event;
import com.popups.pupoo.event.dto.EventResponse;
import com.popups.pupoo.event.persistence.EventRepository;
import com.popups.pupoo.program.persistence.ProgramRepository;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;

/**
 * User event read service
 */
@Service
public class EventService {

    private final EventRepository eventRepository;
    private final ProgramRepository programRepository;

    public EventService(EventRepository eventRepository, ProgramRepository programRepository) {
        this.eventRepository = eventRepository;
        this.programRepository = programRepository;
    }

    public Page<EventResponse> getEvents(Pageable pageable, String keyword, EventStatus status,
                                         LocalDateTime fromAt, LocalDateTime toAt) {
        EventStatus safeStatus = (status == EventStatus.CANCELLED) ? null : status;
        return eventRepository.searchPublic(keyword, safeStatus, fromAt, toAt, pageable)
                .map(this::toEventResponse);
    }

    public EventResponse getEvent(Long eventId) {
        Event event = eventRepository.findById(eventId)
                .orElseThrow(() -> new BusinessException(ErrorCode.INVALID_REQUEST, "존재하지 않는 행사입니다. eventId=" + eventId));
        return toEventResponse(event);
    }

    private EventResponse toEventResponse(Event event) {
        EventResponse response = EventResponse.from(event);
        String eventImage = toPublicUploadPath(event.getImageUrl());
        response.setImageUrl(eventImage != null ? eventImage : resolveEventThumbnail(event.getEventId()));
        return response;
    }

    private String resolveEventThumbnail(Long eventId) {
        if (eventId == null) return null;
        return programRepository.findFirstByEventIdAndImageUrlIsNotNullOrderByProgramIdAsc(eventId)
                .map(program -> toPublicUploadPath(program.getImageUrl()))
                .orElse(null);
    }

    private String toPublicUploadPath(String rawPath) {
        if (rawPath == null || rawPath.isBlank()) return null;

        String normalized = rawPath.replace('\\', '/');
        String lower = normalized.toLowerCase();

        int idx = lower.indexOf("/uploads/");
        if (idx >= 0) return normalized.substring(idx);

        idx = lower.indexOf("uploads/");
        if (idx >= 0) return "/" + normalized.substring(idx);

        return rawPath;
    }
}
