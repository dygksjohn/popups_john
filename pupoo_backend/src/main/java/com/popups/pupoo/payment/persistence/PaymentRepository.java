// file: src/main/java/com/popups/pupoo/payment/persistence/PaymentRepository.java
package com.popups.pupoo.payment.persistence;

import com.popups.pupoo.payment.domain.enums.PaymentStatus;
import com.popups.pupoo.payment.domain.model.Payment;
import org.springframework.data.domain.*;
import org.springframework.data.jpa.repository.*;
import org.springframework.data.repository.query.Param;

import jakarta.persistence.LockModeType;
import java.util.EnumSet;
import java.util.Optional;

public interface PaymentRepository extends JpaRepository<Payment, Long> {

    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("""
        select p
        from Payment p
        where p.paymentId = :paymentId
        """)
    Optional<Payment> findByIdForUpdate(@Param("paymentId") Long paymentId);

    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("""
        select p
        from Payment p
        where p.eventApplyId = :applyId
          and p.status in :statuses
        """)
    Optional<Payment> findActiveByEventApplyIdForUpdate(
            @Param("applyId") Long applyId,
            @Param("statuses") EnumSet<PaymentStatus> statuses
    );

    // ✅ 조인 조회 결과용 Projection
    interface PaymentHistoryRow {
        Long getPaymentId();
        String getOrderNo();
        java.math.BigDecimal getAmount();
        com.popups.pupoo.payment.domain.enums.PaymentProvider getPaymentMethod();
        com.popups.pupoo.payment.domain.enums.PaymentStatus getStatus();
        java.time.LocalDateTime getRequestedAt();

        // Event
        String getEventTitle();              // ← eventName을 eventTitle로 alias
        java.time.LocalDateTime getEventStartAt(); // ← startAt을 alias
        java.time.LocalDateTime getEventEndAt();   // ← endAt을 alias
    }

    /**
     * ✅ 내 결제 내역(Page): Payment + Event 조인
     * - Event 엔티티: com.popups.pupoo.event.domain.model.Event
     * - 필드: eventId, eventName, startAt, endAt
     */
    @Query("""
        select
          p.paymentId as paymentId,
          p.orderNo as orderNo,
          p.amount as amount,
          p.paymentMethod as paymentMethod,
          p.status as status,
          p.requestedAt as requestedAt,
          e.eventName as eventTitle,
          e.startAt as eventStartAt,
          e.endAt as eventEndAt
        from Payment p
        join Event e on e.eventId = p.eventId
        where p.userId = :userId
        """)
    Page<PaymentHistoryRow> findMyPaymentHistory(@Param("userId") Long userId, Pageable pageable);

    /**
     * ✅ 결제 단건(approve/cancel 응답도 event 정보 포함시키기)
     */
    @Query("""
        select
          p.paymentId as paymentId,
          p.orderNo as orderNo,
          p.amount as amount,
          p.paymentMethod as paymentMethod,
          p.status as status,
          p.requestedAt as requestedAt,
          e.eventName as eventTitle,
          e.startAt as eventStartAt,
          e.endAt as eventEndAt
        from Payment p
        join Event e on e.eventId = p.eventId
        where p.paymentId = :paymentId
        """)
    Optional<PaymentHistoryRow> findPaymentDetail(@Param("paymentId") Long paymentId);

    // (기존에 있던 findByUserId는 남겨도 되지만, 이제 myPayments에서는 사용 안 함)
    Page<Payment> findByUserId(Long userId, Pageable pageable);
}