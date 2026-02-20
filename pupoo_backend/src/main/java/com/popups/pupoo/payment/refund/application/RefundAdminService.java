package com.popups.pupoo.payment.refund.application;

import com.popups.pupoo.event.domain.enums.RegistrationStatus;
import com.popups.pupoo.event.domain.model.EventRegistration;
import com.popups.pupoo.event.persistence.EventRegistrationRepository;
import com.popups.pupoo.program.apply.domain.enums.ApplyStatus;
import com.popups.pupoo.program.apply.domain.model.ProgramApply;
import com.popups.pupoo.program.apply.persistence.ProgramApplyRepository;
import com.popups.pupoo.payment.domain.enums.PaymentStatus;
import com.popups.pupoo.payment.domain.model.Payment;
import com.popups.pupoo.payment.persistence.PaymentRepository;
import com.popups.pupoo.payment.port.PaymentGateway;
import com.popups.pupoo.payment.refund.domain.enums.RefundStatus;
import com.popups.pupoo.payment.refund.domain.model.Refund;
import com.popups.pupoo.payment.refund.dto.RefundResponse;
import com.popups.pupoo.payment.refund.persistence.RefundRepository;
import jakarta.transaction.Transactional;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class RefundAdminService {

    private final RefundRepository refundRepository;
    private final PaymentRepository paymentRepository;
    private final PaymentGateway paymentGateway;

    private final EventRegistrationRepository eventRegistrationRepository;
    private final ProgramApplyRepository programApplyRepository;

    public RefundAdminService(RefundRepository refundRepository,
                              PaymentRepository paymentRepository,
                              PaymentGateway paymentGateway,
                              EventRegistrationRepository eventRegistrationRepository,
                              ProgramApplyRepository programApplyRepository) {
        this.refundRepository = refundRepository;
        this.paymentRepository = paymentRepository;
        this.paymentGateway = paymentGateway;
        this.eventRegistrationRepository = eventRegistrationRepository;
        this.programApplyRepository = programApplyRepository;
    }

    /**
     *  정책: 관리자 환불 승인 = PG 취소 호출 = 즉시 COMPLETED
     *  정책: COMPLETED 시점에 행사/프로그램 자동 취소
     *  자가복구: 이미 COMPLETED여도 다시 호출되면 정합성 보정(행사/프로그램 취소 재시도)
     */
    @Transactional
    public RefundResponse approveAndComplete(Long refundId) {
        // 1) 환불 락
        Refund refund = refundRepository.findByIdForUpdate(refundId)
                .orElseThrow(() -> new IllegalArgumentException("Refund not found: " + refundId));

        // 2) 결제 락 (자가복구를 위해 COMPLETED에서도 필요)
        Payment payment = paymentRepository.findByIdForUpdate(refund.getPaymentId())
                .orElseThrow(() -> new IllegalArgumentException("Payment not found: " + refund.getPaymentId()));

        //  자가복구: 이미 COMPLETED면 PG 호출 없이 정합성만 맞추고 return
        if (refund.getStatus() == RefundStatus.COMPLETED) {
            if (payment.getEventId() != null) {
                autoCancelEventRegistration(payment);
                autoCancelProgramApplies(payment);
            }
            return RefundResponse.from(refund);
        }

        if (refund.getStatus() != RefundStatus.REQUESTED) {
            throw new IllegalStateException("Refund not REQUESTED. status=" + refund.getStatus());
        }

        if (payment.getStatus() != PaymentStatus.APPROVED) {
            throw new IllegalStateException("Refund allowed only when payment is APPROVED. status=" + payment.getStatus());
        }

        // 3) PG 취소/환불
        boolean ok = paymentGateway.cancel(payment);
        if (!ok) {
            throw new IllegalStateException("PG cancel failed");
        }

        // 4) DB 반영(=COMPLETED 확정)
        payment.markRefunded();
        refund.completeNow();

        // 5) COMPLETED 시점 자동 취소
        if (payment.getEventId() != null) {
            autoCancelEventRegistration(payment);
            autoCancelProgramApplies(payment);
        }

        return RefundResponse.from(refund);
    }

    private void autoCancelEventRegistration(Payment payment) {
        eventRegistrationRepository
                .findActiveByEventIdAndUserIdForUpdate(
                        payment.getEventId(),
                        payment.getUserId(),
                        List.of(RegistrationStatus.APPLIED, RegistrationStatus.APPROVED)
                )
                .ifPresent(EventRegistration::cancel);
    }

    private void autoCancelProgramApplies(Payment payment) {
        List<ProgramApply> applies = programApplyRepository.findActiveByEventIdAndUserIdForUpdate(
                payment.getEventId(),
                payment.getUserId(),
                List.of(ApplyStatus.APPLIED, ApplyStatus.WAITING, ApplyStatus.APPROVED)
        );

        applies.forEach(ProgramApply::cancel); // cancelled_at 세팅 + CHECK 충족
    }
}
