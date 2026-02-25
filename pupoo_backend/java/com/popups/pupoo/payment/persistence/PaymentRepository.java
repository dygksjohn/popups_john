// file: src/main/java/com/popups/pupoo/payment/persistence/PaymentRepository.java
package com.popups.pupoo.payment.persistence;

import java.util.Optional;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import com.popups.pupoo.payment.domain.model.Payment;

import jakarta.persistence.LockModeType;

public interface PaymentRepository extends JpaRepository<Payment, Long> {

    Optional<Payment> findByOrderNo(String orderNo);

    Page<Payment> findByUserId(Long userId, Pageable pageable);

    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("select p from Payment p where p.paymentId = :paymentId")
    Optional<Payment> findByIdForUpdate(@Param("paymentId") Long paymentId);

    /**
     * 이벤트 예매/결제 완료 사용자 userId 목록(중복 제거)
     * - status=APPROVED
     */
    @Query("""
        select distinct p.userId
        from Payment p
        where p.eventId = :eventId
          and p.status = :status
    """)
    java.util.List<Long> findDistinctUserIdsByEventIdAndStatus(@Param("eventId") Long eventId,
                                                              @Param("status") com.popups.pupoo.payment.domain.enums.PaymentStatus status);
}
