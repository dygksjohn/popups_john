// file: src/main/java/com/popups/pupoo/notification/persistence/NotificationInboxRepository.java
package com.popups.pupoo.notification.persistence;

import com.popups.pupoo.notification.domain.model.NotificationInbox;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.Optional;

public interface NotificationInboxRepository extends JpaRepository<NotificationInbox, Long> {

    /**
     * 내 미열람(=인박스) 목록 조회.
     * - inbox.createdAt DESC
     */
    @EntityGraph(attributePaths = {"notification"})
    @Query("""
            select i
            from NotificationInbox i
            where i.userId = :userId
            order by i.createdAt desc
            """)
    Page<NotificationInbox> findMyInbox(@Param("userId") Long userId, Pageable pageable);

    /**
     * 클릭(읽음) 처리: 소유자 검증용 조회
     */
    @Query("""
            select i
            from NotificationInbox i
            join fetch i.notification n
            where i.inboxId = :inboxId
              and i.userId = :userId
            """)
    Optional<NotificationInbox> findByInboxIdAndUserId(@Param("inboxId") Long inboxId,
                                                       @Param("userId") Long userId);

    /**
     * 클릭(읽음) 정책: 읽는 순간 인박스에서 삭제.
     */
    @Modifying(clearAutomatically = true, flushAutomatically = true)
    @Query("""
            delete from NotificationInbox i
            where i.inboxId = :inboxId
              and i.userId = :userId
            """)
    int deleteByInboxIdAndUserId(@Param("inboxId") Long inboxId, @Param("userId") Long userId);

    /**
     * [INAPP Fan-out] event_interest_map + user_interest_subscriptions 기반으로
     * 특정 event_id 관심 구독자들에게 인박스 대량 적재.
     *
     *  DB 정책: 인박스는 미열람만 저장. (클릭 시 삭제)
     */
    @Modifying(clearAutomatically = true, flushAutomatically = true)
    @Query(value = """
            INSERT INTO notification_inbox (user_id, notification_id, created_at, target_type, target_id)
            SELECT DISTINCT
                uis.user_id,
                :notificationId,
                NOW(),
                :targetType,
                :targetId
            FROM event_interest_map eim
            JOIN user_interest_subscriptions uis
              ON uis.interest_id = eim.interest_id
            WHERE eim.event_id = :eventId
              AND uis.status = 'ACTIVE'
              AND uis.allow_inapp = 1
            """, nativeQuery = true)
    int fanoutInboxByEventInterest(@Param("eventId") Long eventId,
                                   @Param("notificationId") Long notificationId,
                                   @Param("targetType") String targetType,
                                   @Param("targetId") Long targetId);
}
