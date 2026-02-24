// file: src/main/java/com/popups/pupoo/event/application/EventAdminService.java
package com.popups.pupoo.event.application;

import com.popups.pupoo.common.audit.application.AdminLogService;
import com.popups.pupoo.common.audit.domain.enums.AdminTargetType;
import com.popups.pupoo.common.exception.BusinessException;
import com.popups.pupoo.common.exception.ErrorCode;
import com.popups.pupoo.event.domain.model.Event;
import com.popups.pupoo.event.domain.model.EventInterestMap;
import com.popups.pupoo.event.dto.AdminEventCreateRequest;
import com.popups.pupoo.event.dto.AdminEventUpdateRequest;
import com.popups.pupoo.event.dto.EventResponse;
import com.popups.pupoo.event.persistence.EventInterestMapRepository;
import com.popups.pupoo.event.persistence.EventRepository;
import com.popups.pupoo.notification.application.NotificationService;
import com.popups.pupoo.notification.domain.enums.InboxTargetType;
import com.popups.pupoo.notification.domain.enums.NotificationType;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;
/**
 * 관리자용 EventAdminService
 *
 * - 이벤트 생성/수정 시 interest_id 리스트를 event_interest_map에 저장
 * - update는 "delete + insert" 전략(유지보수 단순화)
 * - interest 기반 알림 발행(인박스 적재)
 */
@Service
public class EventAdminService {

    private final EventRepository eventRepository;
    private final EventInterestMapRepository eventInterestMapRepository;
    private final NotificationService notificationService;
    private final AdminLogService adminLogService;

    public EventAdminService(
            EventRepository eventRepository,
            EventInterestMapRepository eventInterestMapRepository,
            NotificationService notificationService,
            AdminLogService adminLogService
    ) {
        this.eventRepository = eventRepository;
        this.eventInterestMapRepository = eventInterestMapRepository;
        this.notificationService = notificationService;
        this.adminLogService = adminLogService;
    }

    /** 행사 등록(관리자) */
    @Transactional
    public EventResponse createEvent(AdminEventCreateRequest request) {
        Event event = Event.create(
                request.getEventName(),
                request.getDescription(),
                request.getStartAt(),
                request.getEndAt(),
                request.getLocation(),
                request.getStatus(),
                request.getRoundNo()
        );
        Event saved = eventRepository.save(event);

        saveEventInterests(saved.getEventId(), request.getInterestIds());

        // 관심사 기반 행사 알림(인앱)
        notificationService.publishEventInterestNotification(
                saved.getEventId(),
                NotificationType.EVENT,
                "새 행사가 등록되었어요",
                saved.getEventName(),
                InboxTargetType.EVENT,
                saved.getEventId()
        );

        // 관리자 로그 적재
        adminLogService.write("EVENT_CREATE", AdminTargetType.EVENT, saved.getEventId());

        return EventResponse.from(saved);
    }

    /** 행사 수정(관리자) */
    @Transactional
    public EventResponse updateEvent(Long eventId, AdminEventUpdateRequest request) {
        Event event = eventRepository.findById(eventId)
                .orElseThrow(() -> new BusinessException(ErrorCode.INVALID_REQUEST, "존재하지 않는 행사입니다. eventId=" + eventId));

        event.update(
                request.getEventName(),
                request.getDescription(),
                request.getStartAt(),
                request.getEndAt(),
                request.getLocation(),
                request.getStatus(),
                request.getRoundNo()
        );

        saveEventInterests(eventId, request.getInterestIds());

        // 행사 정보 변경 알림
        notificationService.publishEventInterestNotification(
                eventId,
                NotificationType.EVENT,
                "행사 정보가 업데이트되었어요",
                event.getEventName(),
                InboxTargetType.EVENT,
                eventId
        );

        adminLogService.write("EVENT_UPDATE", AdminTargetType.EVENT, eventId);

        return EventResponse.from(event);
    }

    private void saveEventInterests(Long eventId, List<Long> interestIds) {
        eventInterestMapRepository.deleteByEventId(eventId);
        if (interestIds == null || interestIds.isEmpty()) {
            return;
        }
        List<EventInterestMap> mappings = interestIds.stream()
                .distinct()
                .map(interestId -> EventInterestMap.create(eventId, interestId))
                .collect(Collectors.toList());
        eventInterestMapRepository.saveAll(mappings);
    }
}
