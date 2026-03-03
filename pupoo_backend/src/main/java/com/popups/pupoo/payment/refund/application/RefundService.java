// file: src/main/java/com/popups/pupoo/payment/refund/application/RefundService.java
package com.popups.pupoo.payment.refund.application;

import com.popups.pupoo.common.exception.BusinessException;
import com.popups.pupoo.common.exception.ErrorCode;
import com.popups.pupoo.payment.domain.enums.PaymentStatus;
import com.popups.pupoo.payment.domain.model.Payment;
import com.popups.pupoo.payment.persistence.PaymentRepository;
import com.popups.pupoo.payment.refund.domain.model.Refund;
import com.popups.pupoo.payment.refund.dto.RefundRequest;
import com.popups.pupoo.payment.refund.dto.RefundResponse;
import com.popups.pupoo.payment.refund.persistence.RefundRepository;
import jakarta.transaction.Transactional;
import org.springframework.data.domain.*;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;

@Service
public class RefundService {

    private final RefundRepository refundRepository;
    private final PaymentRepository paymentRepository;

    public RefundService(RefundRepository refundRepository, PaymentRepository paymentRepository) {
        this.refundRepository = refundRepository;
        this.paymentRepository = paymentRepository;
    }

    /**
     * 환불 가능 검증 → 환불요청 생성(REQUESTED)
     * - refunds는 payment_id UNIQUE: 결제 1건당 환불 1건
     * - 정책: 전액환불만 허용한다(부분환불 금지)
     */
    @Transactional
    public RefundResponse requestRefund(Long userId, RefundRequest req) {

        Payment payment = paymentRepository.findById(req.paymentId())
                .orElseThrow(() -> new BusinessException(ErrorCode.PAYMENT_NOT_FOUND));

        if (!payment.getUserId().equals(userId)) {
            throw new BusinessException(ErrorCode.REFUND_ACCESS_DENIED);
        }
        if (payment.getStatus() != PaymentStatus.APPROVED) {
            throw new BusinessException(ErrorCode.REFUND_NOT_ALLOWED);
        }
        if (refundRepository.existsByPayment_PaymentId(payment.getPaymentId())) {
            throw new BusinessException(ErrorCode.REFUND_ALREADY_EXISTS);
        }

        // 정책: 전액환불만 허용
        BigDecimal refundAmount = payment.getAmount();
        if (req.refundAmount() != null && req.refundAmount().compareTo(refundAmount) != 0) {
            throw new BusinessException(ErrorCode.REFUND_FULL_ONLY);
        }
        if (refundAmount.compareTo(BigDecimal.ZERO) <= 0) {
            throw new BusinessException(ErrorCode.INVALID_REQUEST);
        }

        Refund refund = Refund.requested(payment, refundAmount, req.reason());
        refundRepository.save(refund);

        return RefundResponse.from(refund);
    }

    public Page<RefundResponse> myRefunds(Long userId, Pageable pageable) {
        return refundRepository.findByPayment_UserId(userId, pageable).map(RefundResponse::from);
    }
}
