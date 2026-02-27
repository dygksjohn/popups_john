// file: src/main/java/com/popups/pupoo/event/persistence/EventRepository.java
package com.popups.pupoo.event.persistence;

import com.popups.pupoo.event.domain.enums.EventStatus;
import com.popups.pupoo.event.domain.model.Event;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.LocalDateTime;

public interface EventRepository extends JpaRepository<Event, Long> {

    /**
     * 공개 조회: CANCELLED는 노출하지 않음 (Service에서 status를 null로 넘김)
     */
    @Query("""
        select e
        from Event e
        where (:keyword is null or :keyword = '' or e.eventName like concat('%', :keyword, '%') or e.location like concat('%', :keyword, '%'))
          and (:status is null or e.status = :status)
          and (:fromAt is null or e.startAt >= :fromAt)
          and (:toAt is null or e.endAt <= :toAt)
        order by e.startAt desc, e.eventId desc
        """)
    Page<Event> searchPublic(@Param("keyword") String keyword,
                             @Param("status") EventStatus status,
                             @Param("fromAt") LocalDateTime fromAt,
                             @Param("toAt") LocalDateTime toAt,
                             Pageable pageable);

    /**
     * 관리자 조회: 모든 상태 포함
     */
    @Query("""
        select e
        from Event e
        where (:keyword is null or :keyword = '' or e.eventName like concat('%', :keyword, '%') or e.location like concat('%', :keyword, '%'))
          and (:status is null or e.status = :status)
          and (:fromAt is null or e.startAt >= :fromAt)
          and (:toAt is null or e.endAt <= :toAt)
        order by e.startAt desc, e.eventId desc
        """)
    Page<Event> search(@Param("keyword") String keyword,
                       @Param("status") EventStatus status,
                       @Param("fromAt") LocalDateTime fromAt,
                       @Param("toAt") LocalDateTime toAt,
                       Pageable pageable);

    /**
     * 상태 동기화: PLANNED / ONGOING / ENDED
     */
    @Modifying
    @Query("""
        update Event e
        set e.status = com.popups.pupoo.event.domain.enums.EventStatus.PLANNED
        where e.startAt > current_timestamp
          and e.status <> com.popups.pupoo.event.domain.enums.EventStatus.PLANNED
          and e.status <> com.popups.pupoo.event.domain.enums.EventStatus.CANCELLED
        """)
    int syncToPlanned();

    @Modifying
    @Query("""
        update Event e
        set e.status = com.popups.pupoo.event.domain.enums.EventStatus.ONGOING
        where e.startAt <= current_timestamp
          and e.endAt >= current_timestamp
          and e.status <> com.popups.pupoo.event.domain.enums.EventStatus.ONGOING
          and e.status <> com.popups.pupoo.event.domain.enums.EventStatus.CANCELLED
        """)
    int syncToOngoing();

    @Modifying
    @Query("""
        update Event e
        set e.status = com.popups.pupoo.event.domain.enums.EventStatus.ENDED
        where e.endAt < current_timestamp
          and e.status <> com.popups.pupoo.event.domain.enums.EventStatus.ENDED
          and e.status <> com.popups.pupoo.event.domain.enums.EventStatus.CANCELLED
        """)
    int syncToEnded();

	long countByStatus(EventStatus cancelled);
}
