// file: src/main/java/com/popups/pupoo/notification/application/NotificationService.java
package com.popups.pupoo.notification.application;

import com.popups.pupoo.common.exception.BusinessException;
import com.popups.pupoo.common.exception.ErrorCode;
import com.popups.pupoo.notification.domain.enums.InboxTargetType;
import com.popups.pupoo.notification.domain.enums.NotificationChannel;
import com.popups.pupoo.notification.domain.enums.NotificationType;
import com.popups.pupoo.notification.domain.enums.RecipientScope;
import com.popups.pupoo.notification.domain.enums.SenderType;
import com.popups.pupoo.notification.domain.model.Notification;
import com.popups.pupoo.notification.domain.model.NotificationInbox;
import com.popups.pupoo.notification.domain.model.NotificationSend;
import com.popups.pupoo.notification.domain.model.NotificationSettings;
import com.popups.pupoo.notification.dto.NotificationCreateRequest;
import com.popups.pupoo.notification.dto.NotificationInboxResponse;
import com.popups.pupoo.notification.dto.NotificationListResponse;
import com.popups.pupoo.notification.dto.NotificationResponse;
import com.popups.pupoo.notification.dto.NotificationSettingsResponse;
import com.popups.pupoo.notification.persistence.NotificationInboxRepository;
import com.popups.pupoo.notification.persistence.NotificationRepository;
import com.popups.pupoo.notification.persistence.NotificationSendRepository;
import com.popups.pupoo.notification.persistence.NotificationSettingsRepository;
import com.popups.pupoo.notification.port.NotificationSender;
import com.popups.pupoo.user.persistence.UserRepository;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.EnumSet;
import java.util.List;
import java.util.Objects;

/**
 * 알림 서비스
 *
 * v1.0 정책
 * - notification: 알림 원문(타입/제목/내용)
 * - notification_inbox: 수신자별 인박스(미열람) 적재
 * - notification_send: 발신/채널 로그(로컬에서는 로그/DB 적재로 대체)
 * - 읽음 처리: 클릭 시 inbox row 삭제
 */
@Service
@Transactional(readOnly = true)
public class NotificationService {

    private final NotificationRepository notificationRepository;
    private final NotificationInboxRepository notificationInboxRepository;
    private final NotificationSettingsRepository notificationSettingsRepository;
    private final NotificationSendRepository notificationSendRepository;
    private final UserRepository userRepository;
    private final NotificationSender notificationSender;

    public NotificationService(NotificationRepository notificationRepository,
                               NotificationInboxRepository notificationInboxRepository,
                               NotificationSettingsRepository notificationSettingsRepository,
                               NotificationSendRepository notificationSendRepository,
                               UserRepository userRepository,
                               NotificationSender notificationSender) {
        this.notificationRepository = notificationRepository;
        this.notificationInboxRepository = notificationInboxRepository;
        this.notificationSettingsRepository = notificationSettingsRepository;
        this.notificationSendRepository = notificationSendRepository;
        this.userRepository = userRepository;
        this.notificationSender = notificationSender;
    }

    /* =========================================================
     * 1) 인박스 조회
     * ========================================================= */

    public NotificationListResponse getMyInbox(Long userId, Pageable pageable) {
        Page<NotificationInbox> page = notificationInboxRepository.findMyInbox(userId, pageable);
        List<NotificationInboxResponse> items = page.getContent().stream()
                .map(NotificationInboxResponse::from)
                .toList();

        return NotificationListResponse.of(
                items,
                page.getNumber(),
                page.getSize(),
                page.getTotalElements(),
                page.getTotalPages()
        );
    }

    /* =========================================================
     * 2) 클릭(읽음 처리)
     * ========================================================= */

    @Transactional
    public NotificationResponse click(Long userId, Long inboxId) {
        NotificationInbox inbox = notificationInboxRepository.findByInboxIdAndUserId(inboxId, userId)
                .orElseThrow(() -> new BusinessException(ErrorCode.RESOURCE_NOT_FOUND));

        // 읽음 정책: 클릭 시 삭제
        notificationInboxRepository.delete(inbox);

        return new NotificationResponse(inbox.getTargetType(), inbox.getTargetId());
    }

    /* =========================================================
     * 3) 설정 조회/수정
     * ========================================================= */

    public NotificationSettingsResponse getSettings(Long userId) {
        NotificationSettings settings = notificationSettingsRepository.findById(userId)
                .orElseGet(() -> NotificationSettings.createDefault(userId));
        return NotificationSettingsResponse.from(settings);
    }

    @Transactional
    public NotificationSettingsResponse updateAllowMarketing(Long userId, boolean allowMarketing) {
        NotificationSettings settings = notificationSettingsRepository.findById(userId)
                .orElseGet(() -> NotificationSettings.createDefault(userId));

        settings.updateAllowMarketing(allowMarketing);
        notificationSettingsRepository.save(settings);
        return NotificationSettingsResponse.from(settings);
    }

        /**
     * 이벤트 관심(구독) 기반 알림 발행 (v1.0)
     *
     * - EventAdminService 등 도메인 서비스에서 사용하는 경량 API.
     * - 로컬/운영 공통: notification 저장 + notification_inbox fan-out 수행.
     * - SMS/EMAIL 실발송은 Admin 알림 발행(API)에서만 수행한다.
     */
    @Transactional
    public void publishEventInterestNotification(Long eventId,
                                                 NotificationType type,
                                                 String title,
                                                 String content,
                                                 InboxTargetType targetType,
                                                 Long targetId) {
        Notification notification = Notification.create(type, title, content);
        notificationRepository.save(notification);

        // INAPP fan-out only
        fanoutInbox(eventId, notification.getNotificationId(), targetType, targetId, RecipientScope.INTEREST_SUBSCRIBERS);
    }

/* =========================================================
     * 4) 관리자/시스템 알림 발행
     * ========================================================= */

    @Transactional
    public void publishAdminEventNotification(Long adminUserId, NotificationCreateRequest request) {
        Notification notification = Notification.create(request.getType(), request.getTitle(), request.getContent());
        notificationRepository.save(notification);

        List<NotificationChannel> channels = normalizeChannels(request.getChannels());
        RecipientScope scope = request.getRecipientScope() == null ? RecipientScope.INTEREST_SUBSCRIBERS : request.getRecipientScope();

        // 1) INAPP fan-out
        if (channels.contains(NotificationChannel.APP)) {
            fanoutInbox(request.getEventId(), notification.getNotificationId(), request.getTargetType(), request.getTargetId(), scope);
            notificationSendRepository.save(NotificationSend.create(notification, adminUserId, SenderType.ADMIN, NotificationChannel.APP));
            notificationSender.send(new NotificationSender.SendCommand(notification.getNotificationId(), null, adminUserId, SenderType.ADMIN, NotificationChannel.APP));
        }

        // 2) EMAIL/SMS/PUSH는 v1.0에서는 로컬 로그/DB 적재로 대체
        // - 구독(allow_email/allow_sms) 정책을 DB로부터 fan-out하는 쿼리를 통해 수신자 범위를 확정한다.
        if (channels.contains(NotificationChannel.EMAIL)) {
            fanoutSendOnly(request.getEventId(), notification.getNotificationId(), scope, NotificationChannel.EMAIL);
            notificationSendRepository.save(NotificationSend.create(notification, adminUserId, SenderType.ADMIN, NotificationChannel.EMAIL));
        }

        if (channels.contains(NotificationChannel.SMS)) {
            fanoutSendOnly(request.getEventId(), notification.getNotificationId(), scope, NotificationChannel.SMS);
            notificationSendRepository.save(NotificationSend.create(notification, adminUserId, SenderType.ADMIN, NotificationChannel.SMS));
        }

        if (channels.contains(NotificationChannel.PUSH)) {
            notificationSendRepository.save(NotificationSend.create(notification, adminUserId, SenderType.ADMIN, NotificationChannel.PUSH));
        }
    }

    /* =========================================================
     * 5) 내부 유틸
     * ========================================================= */

    private List<NotificationChannel> normalizeChannels(List<NotificationChannel> channels) {
        if (channels == null || channels.isEmpty()) {
            return List.of(NotificationChannel.APP);
        }

        EnumSet<NotificationChannel> set = EnumSet.noneOf(NotificationChannel.class);
        set.addAll(channels);

        // DB(v1.0) ENUM과 정합성 유지
        return new ArrayList<>(set);
    }

    private void fanoutInbox(Long eventId,
                             Long notificationId,
                             InboxTargetType targetType,
                             Long targetId,
                             RecipientScope scope) {
        if (scope == RecipientScope.INTEREST_SUBSCRIBERS) {
            notificationInboxRepository.fanoutInboxByEventInterest(eventId, notificationId, targetType.name(), targetId);
            return;
        }

        if (scope == RecipientScope.EVENT_REGISTRANTS) {
            notificationInboxRepository.fanoutInboxByEventRegistrants(eventId, notificationId, targetType.name(), targetId);
            return;
        }

        if (scope == RecipientScope.EVENT_PAYERS) {
            notificationInboxRepository.fanoutInboxByEventPayers(eventId, notificationId, targetType.name(), targetId);
            return;
        }

        throw new BusinessException(ErrorCode.INVALID_REQUEST);
    }


    /**
     * EMAIL/SMS 전송 대상 산정 및 전송 호출.
     *
     * 로컬 테스트 정책
     * - 실제 외부 발송(SMS/Email)은 하지 않고, Sender 구현체에서 로그/DB(notification_send)로 대체한다.
     * - 대상자 필터(allow_email/allow_sms)는 DB 조회로 강제한다.
     */
    private void fanoutSendOnly(Long eventId, Long notificationId, RecipientScope scope, NotificationChannel channel) {
        Notification notification = notificationRepository.findById(notificationId)
                .orElseThrow(() -> new BusinessException(ErrorCode.RESOURCE_NOT_FOUND));

        if (channel == NotificationChannel.EMAIL) {
            List<String> emails = resolveEmails(eventId, scope);
            if (!emails.isEmpty()) {
                notificationSender.sendEmail(emails, notification.getNotificationTitle(), notification.getContent());
            }
            return;
        }

        if (channel == NotificationChannel.SMS) {
            List<String> phones = resolvePhones(eventId, scope);
            if (!phones.isEmpty()) {
                notificationSender.sendSms(phones, notification.getContent());
            }
            return;
        }

        throw new BusinessException(ErrorCode.INVALID_REQUEST);
    }

    private List<String> resolveEmails(Long eventId, RecipientScope scope) {
        if (scope == RecipientScope.INTEREST_SUBSCRIBERS) {
            return notificationInboxRepository.findEmailTargetsByEventInterest(eventId);
        }
        if (scope == RecipientScope.EVENT_REGISTRANTS) {
            return notificationInboxRepository.findEmailTargetsByEventRegistrants(eventId);
        }
        if (scope == RecipientScope.EVENT_PAYERS) {
            return notificationInboxRepository.findEmailTargetsByEventPayers(eventId);
        }
        return List.of();
    }

    private List<String> resolvePhones(Long eventId, RecipientScope scope) {
        if (scope == RecipientScope.INTEREST_SUBSCRIBERS) {
            return notificationInboxRepository.findSmsTargetsByEventInterest(eventId);
        }
        if (scope == RecipientScope.EVENT_REGISTRANTS) {
            return notificationInboxRepository.findSmsTargetsByEventRegistrants(eventId);
        }
        if (scope == RecipientScope.EVENT_PAYERS) {
            return notificationInboxRepository.findSmsTargetsByEventPayers(eventId);
        }
        return List.of();
    }
}
