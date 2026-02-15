package com.popups.pupoo.event.application;

import com.popups.pupoo.common.exception.BusinessException;
import com.popups.pupoo.common.exception.ErrorCode;
import com.popups.pupoo.event.domain.enums.EventStatus;
import com.popups.pupoo.event.domain.model.Event;
import com.popups.pupoo.event.dto.EventResponse;
import com.popups.pupoo.event.persistence.EventRepository;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;

/**
 * 사용자용 EventService
 * - 목록 조회
 * - 상세 조회
 *
 * ⚠️ ErrorCode에 NOT_FOUND가 없으므로, "없는 eventId"는 INVALID_REQUEST로 처리
 */
@Service
public class EventService {

    private final EventRepository eventRepository;

    public EventService(EventRepository eventRepository) {
        this.eventRepository = eventRepository;
    }

    public Page<EventResponse> getEvents(Pageable pageable, String keyword, EventStatus status,
                                         LocalDateTime fromAt, LocalDateTime toAt) {

        return eventRepository.search(keyword, status, fromAt, toAt, pageable)
                .map(EventResponse::from);
    }

    public EventResponse getEvent(Long eventId) {
        Event event = eventRepository.findById(eventId)
                .orElseThrow(() -> new BusinessException(ErrorCode.INVALID_REQUEST, "존재하지 않는 행사입니다. eventId=" + eventId));
        return EventResponse.from(event);
    }
}
