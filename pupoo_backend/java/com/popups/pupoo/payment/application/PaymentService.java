// file: src/main/java/com/popups/pupoo/payment/application/PaymentService.java
package com.popups.pupoo.payment.application;

import java.util.UUID;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;

import com.popups.pupoo.common.exception.BusinessException;
import com.popups.pupoo.common.exception.ErrorCode;
import com.popups.pupoo.event.domain.enums.RegistrationStatus;
import com.popups.pupoo.event.domain.model.EventRegistration;
import com.popups.pupoo.event.persistence.EventRegistrationRepository;
import com.popups.pupoo.payment.domain.enums.PaymentStatus;
import com.popups.pupoo.payment.domain.enums.PaymentTransactionStatus;
import com.popups.pupoo.payment.domain.model.Payment;
import com.popups.pupoo.payment.domain.model.PaymentTransaction;
import com.popups.pupoo.payment.dto.PaymentApproveRequest;
import com.popups.pupoo.payment.dto.PaymentCreateRequest;
import com.popups.pupoo.payment.dto.PaymentReadyRequest;
import com.popups.pupoo.payment.dto.PaymentReadyResponse;
import com.popups.pupoo.payment.dto.PaymentResponse;
import com.popups.pupoo.payment.persistence.PaymentRepository;
import com.popups.pupoo.payment.persistence.PaymentTransactionRepository;
import com.popups.pupoo.payment.port.PaymentGateway;

import jakarta.transaction.Transactional;

@Service
public class PaymentService {

    private final PaymentRepository paymentRepository;
    private final PaymentGateway paymentGateway;
    private final PaymentTransactionRepository paymentTransactionRepository;
    private final EventRegistrationRepository eventRegistrationRepository;

    public PaymentService(PaymentRepository paymentRepository,
                          PaymentGateway paymentGateway,
                          PaymentTransactionRepository paymentTransactionRepository,
                          EventRegistrationRepository eventRegistrationRepository) {
        this.paymentRepository = paymentRepository;
        this.paymentGateway = paymentGateway;
        this.paymentTransactionRepository = paymentTransactionRepository;
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
        PaymentReadyResponse ready = paymentGateway.ready(payment, new PaymentReadyRequest("Pupoo 결제", 1, 0));

        // DB 우선 정책: payment_transactions 테이블에 READY 트랜잭션을 적재한다.
        PaymentTransaction readyTx = PaymentTransaction.ready(payment.getPaymentId(), ready.tid(), null);
        paymentTransactionRepository.save(readyTx);

        return ready;
    }

    /**
     * 결제 승인 콜백/처리 (카카오페이: pg_token 필수)
     *  승인 성공 시 event_apply(EventRegistration) 자동 APPROVED 처리
     */
    @Transactional
    public PaymentResponse approvePayment(Long paymentId, String pgToken) {
        Payment payment = paymentRepository.findByIdForUpdate(paymentId)
                .orElseThrow(() -> new BusinessException(ErrorCode.PAYMENT_NOT_FOUND));

        /*
         * 기능: 결제 승인(approve) 멱등 + 상태 동기화
         * - payment.status와 payment_transactions.status가 어긋나는 경우(중간 장애/재시도)도 안전하게 수렴시킨다.
         */
        PaymentTransaction tx = paymentTransactionRepository.findLatestByPaymentIdForUpdate(paymentId, PageRequest.of(0, 1))
                .stream().findFirst()
                .orElseThrow(() -> new BusinessException(ErrorCode.PAYMENT_TX_NOT_FOUND));

        // 이미 승인 완료된 트랜잭션이면, payment도 승인 상태로 수렴시킨다(멱등)
        if (tx.getStatus() == PaymentTransactionStatus.APPROVED) {
            if (payment.getStatus() != PaymentStatus.APPROVED) {
                payment.markApproved();
                autoApproveEventApply(payment);
            }
            return PaymentResponse.from(payment);
        }

        // 취소/실패 트랜잭션은 승인 불가
        if (tx.getStatus() == PaymentTransactionStatus.CANCELLED || tx.getStatus() == PaymentTransactionStatus.FAILED) {
            throw new BusinessException(ErrorCode.PAYMENT_TX_INVALID_STATUS);
        }

        // payment 멱등
        if (payment.getStatus() == PaymentStatus.APPROVED) {
            return PaymentResponse.from(payment);
        }
        if (payment.getStatus() != PaymentStatus.REQUESTED) {
            // 기능: 결제 승인 상태 전이 검증
            throw new BusinessException(ErrorCode.PAYMENT_INVALID_STATUS);
        }

        boolean ok = paymentGateway.approve(payment, new PaymentApproveRequest(pgToken));

        if (ok) {
            payment.markApproved();

            autoApproveEventApply(payment);

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
                .orElseThrow(() -> new BusinessException(ErrorCode.PAYMENT_NOT_FOUND));

        /*
         * 기능: 결제 취소(cancel) 멱등 + 상태 동기화
         * - 트랜잭션이 이미 취소된 경우 payment를 CANCELLED로 수렴시킨다.
         */
        PaymentTransaction tx = paymentTransactionRepository.findLatestByPaymentIdForUpdate(paymentId, PageRequest.of(0, 1))
                .stream().findFirst()
                .orElseThrow(() -> new BusinessException(ErrorCode.PAYMENT_TX_NOT_FOUND));

        if (tx.getStatus() == PaymentTransactionStatus.CANCELLED) {
            if (payment.getStatus() != PaymentStatus.CANCELLED) {
                payment.markCancelled();
            }
            return PaymentResponse.from(payment);
        }

        // 실패 트랜잭션은 취소 불가(이미 실패 상태)
        if (tx.getStatus() == PaymentTransactionStatus.FAILED) {
            throw new BusinessException(ErrorCode.PAYMENT_TX_INVALID_STATUS);
        }

        // 승인 트랜잭션인데 payment가 아직 APPROVED가 아니면 수렴
        if (tx.getStatus() == PaymentTransactionStatus.APPROVED && payment.getStatus() != PaymentStatus.APPROVED) {
            payment.markApproved();
        }

        if (payment.getStatus() == PaymentStatus.CANCELLED) {
            return PaymentResponse.from(payment);
        }
        if (payment.getStatus() != PaymentStatus.APPROVED) {
            // 기능: 결제 취소 상태 전이 검증
            throw new BusinessException(ErrorCode.PAYMENT_INVALID_STATUS);
        }

        boolean ok = paymentGateway.cancel(payment);
        // 기능: PG 취소 실패
        if (!ok) throw new BusinessException(ErrorCode.PAYMENT_PG_ERROR);

        payment.markCancelled();
        return PaymentResponse.from(payment);
    }

    public Page<PaymentResponse> myPayments(Long userId, Pageable pageable) {
        return paymentRepository.findByUserId(userId, pageable).map(PaymentResponse::from);
    }

    /**
     * 결제 승인 성공 시 이벤트 참가 신청을 자동 APPROVED 처리한다.
     *
     * 정책
     * - event_apply가 존재하면 APPLIED -> APPROVED 로 전이한다.
     * - 이미 APPROVED 이면 멱등 처리한다.
     * - 참가 신청이 없는 경우(비정상 흐름)에는 생성하지 않고 예외로 처리한다.
     */
    private void autoApproveEventApply(Payment payment) {
        Long eventId = payment.getEventId();
        Long userId = payment.getUserId();

        EventRegistration er = eventRegistrationRepository
                .findByEventIdAndUserIdAndStatusForUpdate(eventId, userId, RegistrationStatus.APPLIED)
                .orElseGet(() -> eventRegistrationRepository.findByEventIdAndUserIdForUpdate(eventId, userId)
                        .orElseThrow(() -> new BusinessException(ErrorCode.EVENT_REGISTRATION_NOT_FOUND)));

        if (er.getStatus() == RegistrationStatus.APPLIED) {
            er.approve();
        }
    }
}
