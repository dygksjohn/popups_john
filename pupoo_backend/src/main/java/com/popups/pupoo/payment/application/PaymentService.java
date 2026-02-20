package com.popups.pupoo.payment.application;

import com.popups.pupoo.event.domain.enums.RegistrationStatus;
import com.popups.pupoo.event.domain.model.EventRegistration;
import com.popups.pupoo.event.persistence.EventRegistrationRepository;
import com.popups.pupoo.payment.domain.enums.PaymentStatus;
import com.popups.pupoo.payment.domain.model.Payment;
import com.popups.pupoo.payment.dto.*;
import com.popups.pupoo.payment.persistence.PaymentRepository;
import com.popups.pupoo.payment.port.PaymentGateway;
import jakarta.transaction.Transactional;
import org.springframework.data.domain.*;
import org.springframework.stereotype.Service;

import java.util.UUID;

@Service
public class PaymentService {

    private final PaymentRepository paymentRepository;
    private final PaymentGateway paymentGateway;
    private final EventRegistrationRepository eventRegistrationRepository;

    public PaymentService(PaymentRepository paymentRepository,
                          PaymentGateway paymentGateway,
                          EventRegistrationRepository eventRegistrationRepository) {
        this.paymentRepository = paymentRepository;
        this.paymentGateway = paymentGateway;
        this.eventRegistrationRepository = eventRegistrationRepository;
    }

    /**
     * 결제 요청 생성 + (KAKAOPAY면) ready 호출하여 redirect URL 반환
     */
    @Transactional
    public PaymentReadyResponse requestPayment(Long userId, Long eventId, PaymentCreateRequest req) {
        String orderNo = "P" + UUID.randomUUID().toString().replace("-", "").substring(0, 20);

        Payment payment = Payment.requested(
                userId,
                eventId,
                orderNo,
                req.amount(),
                req.paymentMethod()
        );

        paymentRepository.save(payment);

        //  ready 호출 (카카오페이 결제창 URL 내려줌)
        return paymentGateway.ready(payment, new PaymentReadyRequest("Pupoo 결제", 1, 0));
    }

    /**
     * 결제 승인 콜백/처리 (카카오페이: pg_token 필수)
     *  승인 성공 시 event_apply(EventRegistration) 자동 APPROVED 처리
     */
    @Transactional
    public PaymentResponse approvePayment(Long paymentId, String pgToken) {
        Payment payment = paymentRepository.findByIdForUpdate(paymentId)
                .orElseThrow(() -> new IllegalArgumentException("Payment not found: " + paymentId));

        // 멱등
        if (payment.getStatus() == PaymentStatus.APPROVED) {
            return PaymentResponse.from(payment);
        }
        if (payment.getStatus() != PaymentStatus.REQUESTED) {
            throw new IllegalStateException("Approve allowed only when REQUESTED. status=" + payment.getStatus());
        }

        boolean ok = paymentGateway.approve(payment, new PaymentApproveRequest(pgToken));

        if (ok) {
            payment.markApproved();

            //  결제 승인 성공 시 event_apply 자동 승인
            if (payment.getEventId() != null) {
                eventRegistrationRepository
                        .findByEventIdAndUserIdAndStatusForUpdate(
                                payment.getEventId(),
                                payment.getUserId(),
                                RegistrationStatus.APPLIED
                        )
                        .ifPresentOrElse(
                                er -> er.approve(),
                                () -> {
                                    //  APPLIED가 없으면 생성 후 승인
                                    EventRegistration created = EventRegistration.create(payment.getEventId(), payment.getUserId());
                                    created.approve(); // status=APPROVED
                                    eventRegistrationRepository.save(created);

                                    System.out.println("[AUTO-APPROVE] created + approved event_apply. eventId="
                                            + payment.getEventId() + ", userId=" + payment.getUserId());
                                }
                        );
            }


        } else {
            payment.markFailed();
        }

        return PaymentResponse.from(payment);
    }

    /**
     * 결제 취소 요청
     * - APPROVED인 결제만 취소 가능(운영 정책에 맞춰 조정)
     */
    @Transactional
    public PaymentResponse cancelPayment(Long paymentId) {
        Payment payment = paymentRepository.findByIdForUpdate(paymentId)
                .orElseThrow(() -> new IllegalArgumentException("Payment not found: " + paymentId));

        if (payment.getStatus() == PaymentStatus.CANCELLED) {
            return PaymentResponse.from(payment);
        }
        if (payment.getStatus() != PaymentStatus.APPROVED) {
            throw new IllegalStateException("Cancel allowed only when APPROVED. status=" + payment.getStatus());
        }

        boolean ok = paymentGateway.cancel(payment);
        if (!ok) throw new IllegalStateException("PG cancel failed");

        payment.markCancelled();
        return PaymentResponse.from(payment);
    }

    public Page<PaymentResponse> myPayments(Long userId, Pageable pageable) {
        return paymentRepository.findByUserId(userId, pageable).map(PaymentResponse::from);
    }
}
