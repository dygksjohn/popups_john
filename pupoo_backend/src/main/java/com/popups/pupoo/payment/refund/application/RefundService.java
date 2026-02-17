package com.popups.pupoo.payment.refund.application;

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
     * - refundAmount 미전달 시 결제금액 전액 환불로 처리
     */
    @Transactional
    public RefundResponse requestRefund(Long userId, RefundRequest req) {

        Payment payment = paymentRepository.findById(req.paymentId())
                .orElseThrow(() -> new IllegalArgumentException("Payment not found: " + req.paymentId()));

        if (!payment.getUserId().equals(userId)) {
            throw new IllegalStateException("Not your payment");
        }
        if (payment.getStatus() != PaymentStatus.APPROVED) {
            throw new IllegalStateException("Refund allowed only when payment is APPROVED");
        }
        if (refundRepository.existsByPayment_PaymentId(payment.getPaymentId())) {
            throw new IllegalStateException("Refund already exists for this payment");
        }

        // ✅ refundAmount 기본값: 결제금액(전액 환불)
        BigDecimal refundAmount = (req.refundAmount() == null) ? payment.getAmount() : req.refundAmount();

        // ✅ 검증
        if (refundAmount.compareTo(BigDecimal.ZERO) <= 0) {
            throw new IllegalArgumentException("refundAmount must be positive");
        }
        if (refundAmount.compareTo(payment.getAmount()) > 0) {
            throw new IllegalArgumentException("refundAmount cannot exceed payment amount");
        }

        Refund refund = Refund.requested(payment, refundAmount, req.reason());
        refundRepository.save(refund);

        return RefundResponse.from(refund);
    }

    public Page<RefundResponse> myRefunds(Long userId, Pageable pageable) {
        return refundRepository.findByPayment_UserId(userId, pageable).map(RefundResponse::from);
    }
}
