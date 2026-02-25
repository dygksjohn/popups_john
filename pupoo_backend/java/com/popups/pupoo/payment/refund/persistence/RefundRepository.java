// file: src/main/java/com/popups/pupoo/payment/refund/persistence/RefundRepository.java
package com.popups.pupoo.payment.refund.persistence;

import java.util.Optional;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import com.popups.pupoo.payment.refund.domain.enums.RefundStatus;
import com.popups.pupoo.payment.refund.domain.model.Refund;

import jakarta.persistence.LockModeType;

public interface RefundRepository extends JpaRepository<Refund, Long> {

    Page<Refund> findAll(Pageable pageable);

    @Query("select r from Refund r join fetch r.payment p where r.refundId = :refundId")
    Optional<Refund> findDetail(@Param("refundId") Long refundId);

    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("select r from Refund r where r.refundId = :refundId")
    Optional<Refund> findByIdForUpdate(@Param("refundId") Long refundId);

    Optional<Refund> findByPayment_PaymentId(Long paymentId);

    Page<Refund> findByPayment_UserId(Long userId, Pageable pageable);

    Page<Refund> findByStatus(RefundStatus status, Pageable pageable);

    boolean existsByPayment_PaymentId(Long paymentId);

    boolean existsByPayment_PaymentIdAndStatus(Long paymentId, RefundStatus status);
}
