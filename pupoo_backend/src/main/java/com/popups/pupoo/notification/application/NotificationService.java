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
import com.popups.pupoo.notification.dto.AdminNotificationPublishResult;
import com.popups.pupoo.notification.dto.NotificationBroadcastRequest;
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
import java.util.LinkedHashSet;
import java.util.List;

/**
 * 인앱 알림 조회와 관리자 발행을 함께 담당한다.
 *
 * - notification: 발행 원문
 * - notification_inbox: 사용자별 미열람 인앱 알림
 * - notification_send: 채널별 발행 이력
 *
 * 현재 읽음 정책은 inbox 행 삭제 방식이다.
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

    /**
     * 아직 읽지 않은 인앱 알림 개수를 반환한다.
     * 헤더 배지 표시에 사용된다.
     */
    public long getUnreadCount(Long userId) {
        return notificationInboxRepository.countByUserId(userId);
    }

    @Transactional
    public NotificationResponse click(Long userId, Long inboxId) {
        NotificationInbox inbox = notificationInboxRepository.findByInboxIdAndUserId(inboxId, userId)
                .orElseThrow(() -> new BusinessException(ErrorCode.RESOURCE_NOT_FOUND));

        // 인앱 알림은 읽는 시점에 inbox 행을 제거한다.
        notificationInboxRepository.delete(inbox);

        return new NotificationResponse(inbox.getTargetType(), inbox.getTargetId());
    }

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
     * 이벤트 관심 등록자 대상 인앱 알림을 발행한다.
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

        fanoutInbox(eventId, notification.getNotificationId(), targetType, targetId, RecipientScope.INTEREST_SUBSCRIBERS);
    }

    /**
     * 단일 사용자 대상 인앱 알림을 발행한다.
     */
    @Transactional
    public void publishUserNoticeNotification(Long userId,
                                              String title,
                                              String content,
                                              InboxTargetType targetType,
                                              Long targetId) {
        if (userId == null || !userRepository.existsById(userId)) {
            return;
        }
        Notification notification = Notification.create(NotificationType.SYSTEM, title, content);
        notificationRepository.save(notification);
        notificationInboxRepository.save(NotificationInbox.create(userId, notification, targetType, targetId));
        notificationSendRepository.save(
                NotificationSend.create(notification, userId, SenderType.SYSTEM, NotificationChannel.APP)
        );
        notificationSender.send(
                new NotificationSender.SendCommand(
                        notification.getNotificationId(),
                        userId,
                        userId,
                        SenderType.SYSTEM,
                        NotificationChannel.APP
                )
        );
    }

    /**
     * 관리자 이벤트 알림은 채널별로 fan-out 전략이 다르다.
     * APP은 inbox row를 만들고, EMAIL/SMS는 실제 수신 대상을 해석해 바로 전송한다.
     */
    @Transactional
    public AdminNotificationPublishResult publishAdminEventNotification(Long adminUserId, NotificationCreateRequest request) {
        Notification notification = Notification.create(request.getType(), request.getTitle(), request.getContent());
        notificationRepository.save(notification);

        List<NotificationChannel> channels = normalizeChannels(request.getChannels());
        List<RecipientScope> scopes = normalizeRecipientScopes(request);
        int targetCount = countAdminEventRecipients(request.getEventId(), scopes);

        if (channels.contains(NotificationChannel.APP)) {
            fanoutInbox(request.getEventId(), notification, request.getTargetType(), request.getTargetId(), scopes);
            notificationSendRepository.save(NotificationSend.create(notification, adminUserId, SenderType.ADMIN, NotificationChannel.APP));
            notificationSender.send(new NotificationSender.SendCommand(notification.getNotificationId(), null, adminUserId, SenderType.ADMIN, NotificationChannel.APP));
        }

        if (channels.contains(NotificationChannel.EMAIL)) {
            fanoutSendOnly(request.getEventId(), notification.getNotificationId(), scopes, NotificationChannel.EMAIL);
            notificationSendRepository.save(NotificationSend.create(notification, adminUserId, SenderType.ADMIN, NotificationChannel.EMAIL));
        }

        if (channels.contains(NotificationChannel.SMS)) {
            fanoutSendOnly(request.getEventId(), notification.getNotificationId(), scopes, NotificationChannel.SMS);
            notificationSendRepository.save(NotificationSend.create(notification, adminUserId, SenderType.ADMIN, NotificationChannel.SMS));
        }

        if (channels.contains(NotificationChannel.PUSH)) {
            notificationSendRepository.save(NotificationSend.create(notification, adminUserId, SenderType.ADMIN, NotificationChannel.PUSH));
        }
        return new AdminNotificationPublishResult(notification.getNotificationId(), targetCount);
    }

    @Transactional
    public AdminNotificationPublishResult publishAdminBroadcastNotification(Long adminUserId, NotificationBroadcastRequest request) {
        Notification notification = Notification.create(request.getType(), request.getTitle(), request.getContent());
        notificationRepository.save(notification);

        List<NotificationChannel> channels = normalizeChannels(request.getChannels());
        InboxTargetType targetType = request.getTargetType() == null ? InboxTargetType.NOTICE : request.getTargetType();
        Long targetId = request.getTargetId() == null ? 0L : request.getTargetId();
        int targetCount = countAllActiveRecipients();

        if (channels.contains(NotificationChannel.APP)) {
            targetCount = notificationInboxRepository.fanoutInboxByAllActiveUsers(
                    notification.getNotificationId(),
                    targetType.name(),
                    targetId
            );
            notificationSendRepository.save(NotificationSend.create(notification, adminUserId, SenderType.ADMIN, NotificationChannel.APP));
            notificationSender.send(new NotificationSender.SendCommand(notification.getNotificationId(), null, adminUserId, SenderType.ADMIN, NotificationChannel.APP));
        }

        if (channels.contains(NotificationChannel.EMAIL)) {
            notificationSendRepository.save(NotificationSend.create(notification, adminUserId, SenderType.ADMIN, NotificationChannel.EMAIL));
        }

        if (channels.contains(NotificationChannel.SMS)) {
            notificationSendRepository.save(NotificationSend.create(notification, adminUserId, SenderType.ADMIN, NotificationChannel.SMS));
        }

        if (channels.contains(NotificationChannel.PUSH)) {
            notificationSendRepository.save(NotificationSend.create(notification, adminUserId, SenderType.ADMIN, NotificationChannel.PUSH));
        }
        return new AdminNotificationPublishResult(notification.getNotificationId(), targetCount);
    }

    private List<NotificationChannel> normalizeChannels(List<NotificationChannel> channels) {
        if (channels == null || channels.isEmpty()) {
            return List.of(NotificationChannel.APP);
        }

        EnumSet<NotificationChannel> set = EnumSet.noneOf(NotificationChannel.class);
        set.addAll(channels);
        return new ArrayList<>(set);
    }

    public List<RecipientScope> normalizeAdminRecipientScopes(RecipientScope recipientScope,
                                                              List<RecipientScope> recipientScopes) {
        EnumSet<RecipientScope> scopes = EnumSet.noneOf(RecipientScope.class);
        if (recipientScopes != null) {
            scopes.addAll(recipientScopes);
        }
        if (recipientScope != null) {
            scopes.add(recipientScope);
        }
        if (scopes.isEmpty()) {
            scopes.add(RecipientScope.INTEREST_SUBSCRIBERS);
        }
        return new ArrayList<>(scopes);
    }

    private List<RecipientScope> normalizeRecipientScopes(NotificationCreateRequest request) {
        return normalizeAdminRecipientScopes(request.getRecipientScope(), request.getRecipientScopes());
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

    private void fanoutInbox(Long eventId,
                             Notification notification,
                             InboxTargetType targetType,
                             Long targetId,
                             List<RecipientScope> scopes) {
        LinkedHashSet<Long> recipientUserIds = resolveRecipientUserIds(eventId, scopes);
        if (recipientUserIds.isEmpty()) {
            return;
        }
        List<NotificationInbox> inboxes = recipientUserIds.stream()
                .map(userId -> NotificationInbox.create(userId, notification, targetType, targetId))
                .toList();
        notificationInboxRepository.saveAll(inboxes);
    }

    /**
     * 이메일과 SMS는 사용자 설정과 대상 범위를 모두 반영해 실제 수신 대상을 해석한다.
     * 인앱과 달리 inbox row는 만들지 않는다.
     */
    private void fanoutSendOnly(Long eventId,
                                Long notificationId,
                                List<RecipientScope> scopes,
                                NotificationChannel channel) {
        Notification notification = notificationRepository.findById(notificationId)
                .orElseThrow(() -> new BusinessException(ErrorCode.RESOURCE_NOT_FOUND));

        if (channel == NotificationChannel.EMAIL) {
            List<String> emails = resolveEmails(eventId, scopes);
            if (!emails.isEmpty()) {
                notificationSender.sendEmail(emails, notification.getNotificationTitle(), notification.getContent());
            }
            return;
        }

        if (channel == NotificationChannel.SMS) {
            List<String> phones = resolvePhones(eventId, scopes);
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

    private List<String> resolveEmails(Long eventId, List<RecipientScope> scopes) {
        LinkedHashSet<String> emails = new LinkedHashSet<>();
        for (RecipientScope scope : scopes) {
            emails.addAll(resolveEmails(eventId, scope));
        }
        return new ArrayList<>(emails);
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

    private List<String> resolvePhones(Long eventId, List<RecipientScope> scopes) {
        LinkedHashSet<String> phones = new LinkedHashSet<>();
        for (RecipientScope scope : scopes) {
            phones.addAll(resolvePhones(eventId, scope));
        }
        return new ArrayList<>(phones);
    }

    private LinkedHashSet<Long> resolveRecipientUserIds(Long eventId, List<RecipientScope> scopes) {
        LinkedHashSet<Long> recipientUserIds = new LinkedHashSet<>();
        for (RecipientScope scope : scopes) {
            if (scope == RecipientScope.INTEREST_SUBSCRIBERS) {
                recipientUserIds.addAll(notificationInboxRepository.findInAppUserIdsByEventInterest(eventId));
                continue;
            }
            if (scope == RecipientScope.EVENT_REGISTRANTS) {
                recipientUserIds.addAll(notificationInboxRepository.findInAppUserIdsByEventRegistrants(eventId));
                continue;
            }
            if (scope == RecipientScope.EVENT_PAYERS) {
                recipientUserIds.addAll(notificationInboxRepository.findInAppUserIdsByEventPayers(eventId));
                continue;
            }
            throw new BusinessException(ErrorCode.INVALID_REQUEST);
        }
        return recipientUserIds;
    }

    public int countAdminEventRecipients(Long eventId, List<RecipientScope> scopes) {
        return resolveRecipientUserIds(eventId, scopes).size();
    }

    public int countAllActiveRecipients() {
        return notificationInboxRepository.countAllActiveUsers();
    }
}
