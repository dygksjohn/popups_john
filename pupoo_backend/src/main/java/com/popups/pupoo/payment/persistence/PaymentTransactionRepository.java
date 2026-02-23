// file: src/main/java/com/popups/pupoo/payment/persistence/PaymentTransactionRepository.java
package com.popups.pupoo.payment.persistence;

import com.popups.pupoo.payment.domain.model.PaymentTransaction;
import jakarta.persistence.LockModeType;
import org.springframework.data.jpa.repository.*;
import org.springframework.data.repository.query.Param;

import java.util.Optional;

public interface PaymentTransactionRepository extends JpaRepository<PaymentTransaction, Long> {

    Optional<PaymentTransaction> findByPaymentId(Long paymentId);

    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("select tx from PaymentTransaction tx where tx.paymentId = :paymentId")
    Optional<PaymentTransaction> findByPaymentIdForUpdate(@Param("paymentId") Long paymentId);
}
