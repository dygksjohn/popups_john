// file: src/main/java/com/popups/pupoo/payment/infrastructure/KakaoPayGateway.java
package com.popups.pupoo.payment.infrastructure;

import com.popups.pupoo.payment.domain.enums.PaymentProvider;
import com.popups.pupoo.payment.domain.enums.PaymentStatus;
import com.popups.pupoo.payment.domain.model.Payment;
import com.popups.pupoo.payment.domain.model.PaymentTransaction;
import com.popups.pupoo.payment.dto.PaymentApproveRequest;
import com.popups.pupoo.payment.dto.PaymentReadyRequest;
import com.popups.pupoo.payment.dto.PaymentReadyResponse;
import com.popups.pupoo.payment.persistence.PaymentTransactionRepository;
import com.popups.pupoo.payment.port.PaymentGateway;
import com.popups.pupoo.common.exception.BusinessException;
import com.popups.pupoo.common.exception.ErrorCode;
import jakarta.transaction.Transactional;
import org.springframework.stereotype.Component;
import org.springframework.web.client.HttpStatusCodeException;

import java.math.BigDecimal;

@Component
public class KakaoPayGateway implements PaymentGateway {

    private final KakaoPayClient client;
    private final KakaoPayProperties props;
    private final PaymentTransactionRepository txRepository;

    public KakaoPayGateway(
            KakaoPayClient client,
            KakaoPayProperties props,
            PaymentTransactionRepository txRepository
    ) {
        this.client = client;
        this.props = props;
        this.txRepository = txRepository;
    }

    /**
     * KAKAOPAY ready
     * - payments: 이미 REQUESTED로 저장되어 있어야 함
     * - payment_transactions: READY + tid 저장
     * - redirect URL 반환
     */
    @Override
    @Transactional
    public PaymentReadyResponse ready(Payment payment, PaymentReadyRequest req) {
        validateKakaoPay(payment);

        // 멱등: 이미 tx가 있으면 raw_ready로 동일 응답을 재구성하여 반환한다.
        // - READY/APPROVED는 "이미 ready가 한번 수행된 결제"로 보고 그대로 반환한다.
        // - CANCELLED/FAILED는 재-ready를 허용하지 않는다(결제는 새로 생성해야 함)
        PaymentTransaction existing = txRepository.findByPaymentIdForUpdate(payment.getPaymentId()).orElse(null);
        if (existing != null) {
            if ("READY".equals(existing.getStatus().name()) || "APPROVED".equals(existing.getStatus().name())) {
                if (existing.getRawReady() == null || existing.getRawReady().isBlank()) {
                    throw new BusinessException(ErrorCode.PAYMENT_PG_ERROR);
                }
                KakaoPayReadyResponse raw = client.parseReadyResponse(existing.getRawReady());
                return new PaymentReadyResponse(
                        payment.getPaymentId(),
                        payment.getOrderNo(),
                        existing.getPgTid(),
                        raw.next_redirect_pc_url(),
                        raw.next_redirect_mobile_url()
                );
            }
            // 기능: READY 재호출 불가 상태
            throw new BusinessException(ErrorCode.PAYMENT_TX_INVALID_STATUS);
        }

        // URL 확정 (paymentId 치환)
        String approvalUrl = props.approvalUrl().replace("{paymentId}", String.valueOf(payment.getPaymentId()));
        String cancelUrl = props.cancelUrl().replace("{paymentId}", String.valueOf(payment.getPaymentId()));
        String failUrl = props.failUrl().replace("{paymentId}", String.valueOf(payment.getPaymentId()));

        // === 요청값 기본 검증(카카오가 500으로 뭉개는 케이스 예방) ===
        // 기능: 결제 요청값 검증
        if (req.quantity() <= 0) throw new BusinessException(ErrorCode.VALIDATION_FAILED);
        if (req.itemName() == null || req.itemName().isBlank()) throw new BusinessException(ErrorCode.VALIDATION_FAILED);

        int totalAmount = toIntAmount(payment.getAmount()); // 카카오: 보통 정수 금액
        int taxFree = Math.max(req.taxFreeAmount(), 0);
        if (taxFree > totalAmount) throw new BusinessException(ErrorCode.VALIDATION_FAILED);

        KakaoPayReadyRequest readyReq = new KakaoPayReadyRequest(
                props.cid(),
                payment.getOrderNo(),
                String.valueOf(payment.getUserId()),
                req.itemName(),
                req.quantity(),
                totalAmount,
                taxFree,
                approvalUrl,
                cancelUrl,
                failUrl
        );

        //  요청 로그(민감정보 없음)
        System.out.println("[KakaoPay][READY] paymentId=" + payment.getPaymentId()
                + ", cid=" + props.cid()
                + ", orderNo=" + payment.getOrderNo()
                + ", userId=" + payment.getUserId()
                + ", item=" + req.itemName()
                + ", qty=" + req.quantity()
                + ", total=" + totalAmount
                + ", taxFree=" + taxFree
                + ", approvalUrl=" + approvalUrl
                + ", cancelUrl=" + cancelUrl
                + ", failUrl=" + failUrl);

        try {
            KakaoPayReadyResponse res = client.ready(readyReq);

            PaymentTransaction tx = PaymentTransaction.ready(
                    payment.getPaymentId(),
                    res.tid(),
                    client.toJson(res)
            );
            txRepository.save(tx);

            return new PaymentReadyResponse(
                    payment.getPaymentId(),
                    payment.getOrderNo(),
                    res.tid(),
                    res.next_redirect_pc_url(),
                    res.next_redirect_mobile_url()
            );
        } catch (HttpStatusCodeException e) {
            //  카카오가 내려주는 body를 그대로 로그로 남겨야 원인 추적 가능
            System.out.println("[KakaoPay][READY][ERROR] status=" + e.getStatusCode()
                    + ", body=" + e.getResponseBodyAsString());
            throw e;
        }
    }

    /**
     * KAKAOPAY approve
     * - payment_transactions(READY) must exist
     * - pg_token required
     * - 성공 시 tx APPROVED + raw_approve 저장
     */
    @Override
    @Transactional
    public boolean approve(Payment payment, PaymentApproveRequest req) {
        validateKakaoPay(payment);

        if (payment.getStatus() != PaymentStatus.REQUESTED) {
            // 기능: 결제 승인 상태 전이 검증
            throw new BusinessException(ErrorCode.PAYMENT_INVALID_STATUS);
        }
        if (req.pgToken() == null || req.pgToken().isBlank()) {
            // 기능: pg_token 필수
            throw new BusinessException(ErrorCode.VALIDATION_FAILED);
        }

        PaymentTransaction tx = txRepository.findByPaymentIdForUpdate(payment.getPaymentId())
                .orElseThrow(() -> new BusinessException(ErrorCode.PAYMENT_TX_NOT_FOUND));

        // 멱등: 이미 승인된 트랜잭션이면 true 반환
        if ("APPROVED".equals(tx.getStatus().name())) {
            return true;
        }

        // 승인 요청은 READY 상태에서만 허용
        if (!"READY".equals(tx.getStatus().name())) {
            // 기능: 트랜잭션 상태 전이 검증
            throw new BusinessException(ErrorCode.PAYMENT_TX_INVALID_STATUS);
        }

        tx.setPgToken(req.pgToken());

        KakaoPayApproveRequest approveReq = new KakaoPayApproveRequest(
                props.cid(),
                tx.getPgTid(),
                payment.getOrderNo(),
                String.valueOf(payment.getUserId()),
                req.pgToken()
        );

        //  요청 로그
        System.out.println("[KakaoPay][APPROVE] paymentId=" + payment.getPaymentId()
                + ", cid=" + props.cid()
                + ", tid=" + tx.getPgTid()
                + ", orderNo=" + payment.getOrderNo()
                + ", userId=" + payment.getUserId());

        try {
            KakaoPayApproveResponse res = client.approve(approveReq);
            tx.markApproved(client.toJson(res));
            return true;
        } catch (HttpStatusCodeException e) {
            System.out.println("[KakaoPay][APPROVE][ERROR] status=" + e.getStatusCode()
                    + ", body=" + e.getResponseBodyAsString());
            tx.markFailed(e.getResponseBodyAsString());
            return false;
        } catch (Exception e) {
            tx.markFailed("{\"error\":\"approve failed\"}");
            return false;
        }
    }

    @Override
    @Transactional
    public boolean cancel(Payment payment) {
        if (payment.getPaymentMethod() != PaymentProvider.KAKAOPAY) {
            // 기능: 결제수단 검증
            throw new BusinessException(ErrorCode.INVALID_REQUEST);
        }

        // 결제 취소/환불은 승인된 결제만 가능(정책)
        if (payment.getStatus() != PaymentStatus.APPROVED) {
            // 기능: 결제 취소 상태 전이 검증
            throw new BusinessException(ErrorCode.PAYMENT_INVALID_STATUS);
        }

        PaymentTransaction tx = txRepository.findByPaymentIdForUpdate(payment.getPaymentId())
                .orElseThrow(() -> new BusinessException(ErrorCode.PAYMENT_TX_NOT_FOUND));

        // 멱등: 이미 CANCELLED면 true 반환
        if ("CANCELLED".equals(tx.getStatus().name())) {
            return true;
        }

        // APPROVED 상태의 트랜잭션만 취소 가능(정책)
        if (!"APPROVED".equals(tx.getStatus().name())) {
            // 기능: 트랜잭션 상태 전이 검증
            throw new BusinessException(ErrorCode.PAYMENT_TX_INVALID_STATUS);
        }

        int cancelAmount = payment.getAmount().intValue(); // 현재 금액이 정수라는 전제(테스트)

        KakaoPayCancelRequest cancelReq = new KakaoPayCancelRequest(
                props.cid(),
                tx.getPgTid(),
                cancelAmount,
                0
        );

        System.out.println("[KakaoPay][CANCEL] paymentId=" + payment.getPaymentId()
                + ", tid=" + tx.getPgTid()
                + ", cancelAmount=" + cancelAmount);

        try {
            KakaoPayCancelResponse res = client.cancel(cancelReq);
            tx.markCancelled(client.toJson(res));
            return true;
        } catch (HttpStatusCodeException e) {
            System.out.println("[KakaoPay][CANCEL][ERROR] status=" + e.getStatusCode()
                    + ", body=" + e.getResponseBodyAsString());
            tx.markFailed(e.getResponseBodyAsString());
            return false;
        } catch (Exception e) {
            tx.markFailed("{\"error\":\"cancel failed\"}");
            return false;
        }
    }


    private void validateKakaoPay(Payment payment) {
        if (payment.getPaymentMethod() != PaymentProvider.KAKAOPAY) {
            // 기능: 결제수단 검증
            throw new BusinessException(ErrorCode.INVALID_REQUEST);
        }
    }

    /**
     * 카카오 API가 정수 금액을 요구하는 경우가 많아서 방어적으로 처리.
     * - 소수점이 들어오면 예외로 막아버림(정책). 필요하면 반올림/절삭 정책으로 바꿔.
     */
    private int toIntAmount(BigDecimal amount) {
        // 기능: 금액 검증
        if (amount == null) throw new BusinessException(ErrorCode.VALIDATION_FAILED);
        if (amount.scale() > 0 && amount.stripTrailingZeros().scale() > 0) {
            throw new BusinessException(ErrorCode.VALIDATION_FAILED);
        }
        return amount.intValueExact();
    }
}
