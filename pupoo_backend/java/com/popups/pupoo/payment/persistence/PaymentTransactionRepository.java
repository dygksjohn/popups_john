// file: src/main/java/com/popups/pupoo/payment/persistence/PaymentTransactionRepository.java
package com.popups.pupoo.payment.persistence;

import java.util.List;
import java.util.Optional;

import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import com.popups.pupoo.payment.domain.model.PaymentTransaction;

import jakarta.persistence.LockModeType;

public interface PaymentTransactionRepository extends JpaRepository<PaymentTransaction, Long> {

    List<PaymentTransaction> findByPaymentId(Long paymentId);

    Optional<PaymentTransaction> findTopByPaymentIdOrderByTxIdDesc(Long paymentId);

    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("select tx from PaymentTransaction tx where tx.paymentId = :paymentId order by tx.txId desc")
    List<PaymentTransaction> findLatestByPaymentIdForUpdate(@Param("paymentId") Long paymentId, Pageable pageable);
}
