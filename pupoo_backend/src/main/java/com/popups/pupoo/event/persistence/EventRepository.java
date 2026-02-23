// file: src/main/java/com/popups/pupoo/event/persistence/EventRepository.java
package com.popups.pupoo.event.persistence;

import com.popups.pupoo.event.domain.enums.EventStatus;
import com.popups.pupoo.event.domain.model.Event;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.LocalDateTime;
/**
 * EventRepository (v2.5 기준)
 *
 * 목록 조회 요구:
 * - keyword(옵션): event_name / description LIKE
 * - status(옵션)
 * - 기간(옵션): start_at ~ end_at 범위 필터(단순 start_at 기준)
 *
 * created_at이 없으므로 정렬은 start_at/event_id 기준으로 처리
 */
public interface EventRepository extends JpaRepository<Event, Long> {

        /**
     * 공개 조회용: CANCELLED 제외
     */
    @Query("""
        SELECT e
        FROM Event e
        WHERE e.status <> com.popups.pupoo.event.domain.enums.EventStatus.CANCELLED
          AND (:status IS NULL OR e.status = :status)
          AND (
                :keyword IS NULL OR :keyword = ''
                OR e.eventName LIKE CONCAT('%', :keyword, '%')
                OR e.description LIKE CONCAT('%', :keyword, '%')
          )
          AND (:fromAt IS NULL OR e.startAt >= :fromAt)
          AND (:toAt IS NULL OR e.startAt <= :toAt)
        ORDER BY e.startAt DESC, e.eventId DESC
    """)
    Page<Event> searchPublic(
            @Param("keyword") String keyword,
            @Param("status") EventStatus status,
            @Param("fromAt") LocalDateTime fromAt,
            @Param("toAt") LocalDateTime toAt,
            Pageable pageable
    );

@Query("""
        SELECT e
        FROM Event e
        WHERE (:status IS NULL OR e.status = :status)
          AND (
                :keyword IS NULL OR :keyword = ''
                OR e.eventName LIKE CONCAT('%', :keyword, '%')
                OR e.description LIKE CONCAT('%', :keyword, '%')
          )
          AND (:fromAt IS NULL OR e.startAt >= :fromAt)
          AND (:toAt IS NULL OR e.startAt <= :toAt)
        ORDER BY e.startAt DESC, e.eventId DESC
    """)
    Page<Event> search(
            @Param("keyword") String keyword,
            @Param("status") EventStatus status,
            @Param("fromAt") LocalDateTime fromAt,
            @Param("toAt") LocalDateTime toAt,
            Pageable pageable
    );       

}
