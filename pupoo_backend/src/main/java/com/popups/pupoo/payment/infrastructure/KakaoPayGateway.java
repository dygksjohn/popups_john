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

        // 이미 tx 있으면 재생성 방지 (중복 ready 호출 방지)
        txRepository.findByPaymentId(payment.getPaymentId()).ifPresent(tx -> {
            throw new IllegalStateException("PaymentTransaction already exists. paymentId=" + payment.getPaymentId()
                    + ", txStatus=" + tx.getStatus());
        });

        // URL 확정 (paymentId 치환)
        String approvalUrl = props.approvalUrl().replace("{paymentId}", String.valueOf(payment.getPaymentId()));
        String cancelUrl = props.cancelUrl().replace("{paymentId}", String.valueOf(payment.getPaymentId()));
        String failUrl = props.failUrl().replace("{paymentId}", String.valueOf(payment.getPaymentId()));

        // === 요청값 기본 검증(카카오가 500으로 뭉개는 케이스 예방) ===
        if (req.quantity() <= 0) throw new IllegalArgumentException("quantity must be >= 1");
        if (req.itemName() == null || req.itemName().isBlank()) throw new IllegalArgumentException("itemName is required");

        int totalAmount = toIntAmount(payment.getAmount()); // 카카오: 보통 정수 금액
        int taxFree = Math.max(req.taxFreeAmount(), 0);
        if (taxFree > totalAmount) throw new IllegalArgumentException("taxFreeAmount must be <= totalAmount");

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

        // ✅ 요청 로그(민감정보 없음)
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
            // ✅ 카카오가 내려주는 body를 그대로 로그로 남겨야 원인 추적 가능
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
            throw new IllegalStateException("Payment not REQUESTED. status=" + payment.getStatus());
        }
        if (req.pgToken() == null || req.pgToken().isBlank()) {
            throw new IllegalArgumentException("pg_token is required");
        }

        PaymentTransaction tx = txRepository.findByPaymentIdForUpdate(payment.getPaymentId())
                .orElseThrow(() -> new IllegalArgumentException("PaymentTransaction not found. paymentId=" + payment.getPaymentId()));

        if (!"READY".equals(tx.getStatus().name())) {
            throw new IllegalStateException("TX not READY. status=" + tx.getStatus());
        }

        tx.setPgToken(req.pgToken());

        KakaoPayApproveRequest approveReq = new KakaoPayApproveRequest(
                props.cid(),
                tx.getPgTid(),
                payment.getOrderNo(),
                String.valueOf(payment.getUserId()),
                req.pgToken()
        );

        // ✅ 요청 로그
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
            throw new IllegalStateException("cancel() is only for KAKAOPAY. method=" + payment.getPaymentMethod());
        }

        // 결제 취소/환불은 승인된 결제만 가능(정책)
        if (payment.getStatus() != PaymentStatus.APPROVED) {
            throw new IllegalStateException("Cancel allowed only when payment is APPROVED. status=" + payment.getStatus());
        }

        PaymentTransaction tx = txRepository.findByPaymentIdForUpdate(payment.getPaymentId())
                .orElseThrow(() -> new IllegalArgumentException("PaymentTransaction not found. paymentId=" + payment.getPaymentId()));

        // APPROVED 상태의 트랜잭션만 취소 가능(정책)
        if (!"APPROVED".equals(tx.getStatus().name())) {
            throw new IllegalStateException("TX not APPROVED. status=" + tx.getStatus());
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
            throw new IllegalStateException("KAKAOPAY only. method=" + payment.getPaymentMethod());
        }
    }

    /**
     * 카카오 API가 정수 금액을 요구하는 경우가 많아서 방어적으로 처리.
     * - 소수점이 들어오면 예외로 막아버림(정책). 필요하면 반올림/절삭 정책으로 바꿔.
     */
    private int toIntAmount(BigDecimal amount) {
        if (amount == null) throw new IllegalArgumentException("amount is null");
        if (amount.scale() > 0 && amount.stripTrailingZeros().scale() > 0) {
            throw new IllegalArgumentException("amount must be integer for KakaoPay. amount=" + amount);
        }
        return amount.intValueExact();
    }
}
