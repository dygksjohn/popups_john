// file: src/main/java/com/popups/pupoo/notification/application/NotificationService.java
package com.popups.pupoo.notification.application;

import com.popups.pupoo.common.exception.BusinessException;
import com.popups.pupoo.common.exception.ErrorCode;
import com.popups.pupoo.notification.domain.enums.InboxTargetType;
import com.popups.pupoo.notification.domain.enums.NotificationType;
import com.popups.pupoo.notification.domain.model.Notification;
import com.popups.pupoo.notification.domain.model.NotificationInbox;
import com.popups.pupoo.notification.domain.model.NotificationSettings;
import com.popups.pupoo.notification.dto.NotificationInboxResponse;
import com.popups.pupoo.notification.dto.NotificationListResponse;
import com.popups.pupoo.notification.dto.NotificationResponse;
import com.popups.pupoo.notification.dto.NotificationSettingsResponse;
import com.popups.pupoo.notification.persistence.NotificationInboxRepository;
import com.popups.pupoo.notification.persistence.NotificationRepository;
import com.popups.pupoo.notification.persistence.NotificationSettingsRepository;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
public class NotificationService {

    private final NotificationRepository notificationRepository;
    private final NotificationInboxRepository notificationInboxRepository;
    private final NotificationSettingsRepository notificationSettingsRepository;

    public NotificationService(NotificationRepository notificationRepository,
                               NotificationInboxRepository notificationInboxRepository,
                               NotificationSettingsRepository notificationSettingsRepository) {
        this.notificationRepository = notificationRepository;
        this.notificationInboxRepository = notificationInboxRepository;
        this.notificationSettingsRepository = notificationSettingsRepository;
    }

    /**
     * 내 미열람(=인박스) 알림 목록
     */
    @Transactional(readOnly = true)
    public NotificationListResponse getMyInbox(Long userId, Pageable pageable) {
        Page<NotificationInbox> page = notificationInboxRepository.findMyInbox(userId, pageable);

        List<NotificationInboxResponse> items = page
                .map(NotificationInboxResponse::from)
                .toList();

        return NotificationListResponse.of(items, page.getNumber(), page.getSize(), page.getTotalElements(), page.getTotalPages());
    }

    /**
     * 클릭(읽음) 처리: target 정보를 반환하고 인박스에서 즉시 삭제한다.
     */
    @Transactional
    public NotificationResponse click(Long userId, Long inboxId) {
        NotificationInbox inbox = notificationInboxRepository
                .findByInboxIdAndUserId(inboxId, userId)
                .orElseThrow(() -> new BusinessException(ErrorCode.RESOURCE_NOT_FOUND, "Notification inbox not found"));

        // 이동 정보 확보
        InboxTargetType targetType = inbox.getTargetType();
        Long targetId = inbox.getTargetId();

        // 정책: 읽는 순간 삭제
        notificationInboxRepository.deleteByInboxIdAndUserId(inboxId, userId);

        return new NotificationResponse(targetType, targetId);
    }

    /**
     * (전역) 알림 설정 조회
     */
    @Transactional(readOnly = true)
    public NotificationSettingsResponse getSettings(Long userId) {
        NotificationSettings settings = notificationSettingsRepository
                .findById(userId)
                .orElseGet(() -> NotificationSettings.createDefault(userId));
        return NotificationSettingsResponse.from(settings);
    }

    /**
     * (전역) 마케팅 수신 동의 업데이트
     */
    @Transactional
    public NotificationSettingsResponse updateAllowMarketing(Long userId, boolean allowMarketing) {
        NotificationSettings settings = notificationSettingsRepository
                .findById(userId)
                .orElseGet(() -> {
                    NotificationSettings created = NotificationSettings.createDefault(userId);
                    return notificationSettingsRepository.save(created);
                });

        settings.updateAllowMarketing(allowMarketing);
        NotificationSettings saved = notificationSettingsRepository.save(settings);
        return NotificationSettingsResponse.from(saved);
    }

    /**
     * [INAPP] Interest 기반(=event_interest_map) 이벤트 알림 발행
     *
     * - notification 원본을 저장하고
     * - event_interest_map + user_interest_subscriptions(allow_inapp=1, ACTIVE) 기반으로
     *   notification_inbox에 대량 적재한다.
     *
     * targetType/targetId는 "클릭 시 상세페이지 이동" 정보로 사용.
     */
    @Transactional
    public void publishEventInterestNotification(Long eventId,
                                                 NotificationType type,
                                                 String title,
                                                 String content,
                                                 InboxTargetType targetType,
                                                 Long targetId) {
        Notification notification = notificationRepository.save(Notification.create(type, title, content));

        // fan-out (INAPP)
        notificationInboxRepository.fanoutInboxByEventInterest(
                eventId,
                notification.getNotificationId(),
                targetType.name(),
                targetId
        );
    }
}
