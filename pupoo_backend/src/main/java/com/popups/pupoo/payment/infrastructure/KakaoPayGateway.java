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
import org.springframework.data.domain.PageRequest;
import org.springframework.web.client.RestClientResponseException;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import java.math.BigDecimal;

@Component
public class KakaoPayGateway implements PaymentGateway {

    private static final Logger log = LoggerFactory.getLogger(KakaoPayGateway.class);

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


private PaymentTransaction findLatestTxForUpdate(Long paymentId) {
    return txRepository.findLatestByPaymentIdForUpdate(paymentId, PageRequest.of(0, 1))
            .stream()
            .findFirst()
            .orElse(null);
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
    	
    	log.warn("[KakaoPay][READY_ENTER] paymentId={}, orderNo={}, userId={}",
    	        payment.getPaymentId(), payment.getOrderNo(), payment.getUserId());
    	
    	
        validateKakaoPay(payment);
        validateKakaoPayConfig();

        if (props.cid() == null || props.cid().isBlank()
                || props.approvalUrl() == null || props.approvalUrl().isBlank()
                || props.cancelUrl() == null || props.cancelUrl().isBlank()
                || props.failUrl() == null || props.failUrl().isBlank()) {
            throw new BusinessException(ErrorCode.PAYMENT_PG_ERROR, "KakaoPay config invalid: cid/urls blank");
        }

        // 멱등: 이미 tx가 있으면 raw_ready로 동일 응답을 재구성하여 반환한다.
        // - READY/APPROVED는 "이미 ready가 한번 수행된 결제"로 보고 그대로 반환한다.
        // - CANCELLED/FAILED는 재-ready를 허용하지 않는다(결제는 새로 생성해야 함)
        PaymentTransaction existing = findLatestTxForUpdate(payment.getPaymentId());
        log.warn("[KakaoPay][READY_EXISTING] paymentId={}, existing={}",
                payment.getPaymentId(),
                existing == null ? "null" :
                    ("txId=" + existing.getTxId()
                     + ", status=" + existing.getStatus()
                     + ", rawReadyLen=" + (existing.getRawReady()==null?0:existing.getRawReady().length())));
        if (existing != null) {

            // 1) APPROVED면 결제 완료 → ready 재호출 금지
            if ("APPROVED".equals(existing.getStatus().name())) {
                throw new BusinessException(
                        ErrorCode.PAYMENT_DUPLICATE_ACTIVE, // 또는 새 에러코드 PAYMENT_ALREADY_APPROVED
                        "KakaoPay already approved: paymentId=" + payment.getPaymentId()
                );
            }

            // 2) READY면 멱등 재사용 허용(redirect_url 재구성)
            if ("READY".equals(existing.getStatus().name())) {
                if (existing.getRawReady() == null || existing.getRawReady().isBlank()) {
                    throw new BusinessException(ErrorCode.PAYMENT_PG_ERROR, "KakaoPay idempotency: rawReady missing");
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

            // 3) CANCELLED/FAILED 등은 재-ready 금지(새 payment 생성해야 함)
            throw new BusinessException(
                    ErrorCode.PAYMENT_PG_ERROR,
                    "KakaoPay idempotency: tx status invalid=" + existing.getStatus().name()
            );
        }

        // URL 확정 (paymentId 치환)
        String approvalUrl = props.approvalUrl().replace("{paymentId}", String.valueOf(payment.getPaymentId()));
        String cancelUrl = props.cancelUrl().replace("{paymentId}", String.valueOf(payment.getPaymentId()));
        String failUrl = props.failUrl().replace("{paymentId}", String.valueOf(payment.getPaymentId()));

        // === 요청값 기본 검증(카카오가 500으로 뭉개는 케이스 예방) ===
        // 기능: 결제 요청값 검증
        if (req.quantity() <= 0) throw new BusinessException(ErrorCode.VALIDATION_FAILED, "quantity must be > 0");
        if (req.itemName() == null || req.itemName().isBlank()) throw new BusinessException(ErrorCode.VALIDATION_FAILED, "itemName is required");

        java.math.BigDecimal readyAmount = req.amount();
        if (readyAmount == null || readyAmount.compareTo(java.math.BigDecimal.ZERO) <= 0) {
            throw new BusinessException(ErrorCode.VALIDATION_FAILED, "amount must be > 0");
        }
        int totalAmount = toIntAmount(readyAmount); // 카카오: 보통 정수 금액
        int taxFree = Math.max(req.taxFreeAmount(), 0);
        if (taxFree > totalAmount) throw new BusinessException(ErrorCode.VALIDATION_FAILED, "taxFreeAmount must be <= totalAmount");

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
        log.info("[KakaoPay][READY] paymentId={}, cid={}, orderNo={}, userId={}, item={}, qty={}, total={}, taxFree={}, approvalUrl={}, cancelUrl={}, failUrl={}",
                payment.getPaymentId(),
                props.cid(),
                payment.getOrderNo(),
                payment.getUserId(),
                req.itemName(),
                req.quantity(),
                totalAmount,
                taxFree,
                approvalUrl,
                cancelUrl,
                failUrl);

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
        } catch (RestClientResponseException e) {
            log.error(
                    "[KakaoPay][READY][ERROR] status={}, body={}, cid={}, total={}, approvalUrl={}, cancelUrl={}, failUrl={}",
                    e.getRawStatusCode(),
                    e.getResponseBodyAsString(),
                    props.cid(),
                    totalAmount,
                    approvalUrl,
                    cancelUrl,
                    failUrl,
                    e
            );
            throw new BusinessException(ErrorCode.PAYMENT_PG_ERROR, e.getResponseBodyAsString());
        } catch (Exception e) {
            log.error("[KakaoPay][READY][UNEXPECTED]", e);
            throw new BusinessException(ErrorCode.PAYMENT_PG_ERROR, e.toString());
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
        validateKakaoPayConfig();

        if (payment.getStatus() != PaymentStatus.REQUESTED) {
            // 기능: 결제 승인 상태 전이 검증
            throw new BusinessException(ErrorCode.PAYMENT_INVALID_STATUS);
        }
        if (req.pgToken() == null || req.pgToken().isBlank()) {
            // 기능: pg_token 필수
            throw new BusinessException(ErrorCode.VALIDATION_FAILED);
        }

        PaymentTransaction tx = txRepository.findLatestByPaymentIdForUpdate(payment.getPaymentId(), PageRequest.of(0, 1)).stream().findFirst()
                .orElseThrow(() -> new BusinessException(ErrorCode.PAYMENT_TX_NOT_FOUND));

        // 멱등: 이미 승인된 트랜잭션이면 true 반환
        if ("APPROVED".equals(tx.getStatus().name())) {
            return true;
        }

        // 승인 요청은 READY 상태에서만 허용
        if (!"READY".equals(tx.getStatus().name())) {
            // 기능: 트랜잭션 상태 전이 검증
            throw new BusinessException(ErrorCode.PAYMENT_PG_ERROR, "KakaoPay approve invalid tx status=" + tx.getStatus().name());
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
        log.info("[KakaoPay][APPROVE] paymentId={}, cid={}, tid={}, orderNo={}, userId={}",
                payment.getPaymentId(),
                props.cid(),
                tx.getPgTid(),
                payment.getOrderNo(),
                payment.getUserId());

        try {
            KakaoPayApproveResponse res = client.approve(approveReq);
            tx.markApproved(client.toJson(res));
            return true;
        } catch (RestClientResponseException e) {
            log.error("[KakaoPay][APPROVE][ERROR] status={}, body={}",
                    e.getRawStatusCode(),
                    e.getResponseBodyAsString(),
                    e);
            tx.markFailed(e.getResponseBodyAsString());
            return false;
        } catch (Exception e) {
            log.error("[KakaoPay][APPROVE][UNEXPECTED]", e);
            tx.markFailed(e.toString());
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

        validateKakaoPayConfig();

        // 결제 취소/환불은 승인된 결제만 가능(정책)
        if (payment.getStatus() != PaymentStatus.APPROVED) {
            // 기능: 결제 취소 상태 전이 검증
            throw new BusinessException(ErrorCode.PAYMENT_INVALID_STATUS);
        }

        PaymentTransaction tx = txRepository.findLatestByPaymentIdForUpdate(payment.getPaymentId(), PageRequest.of(0, 1)).stream().findFirst()
                .orElseThrow(() -> new BusinessException(ErrorCode.PAYMENT_TX_NOT_FOUND));

        // 멱등: 이미 CANCELLED면 true 반환
        if ("CANCELLED".equals(tx.getStatus().name())) {
            return true;
        }

        // APPROVED 상태의 트랜잭션만 취소 가능(정책)
        if (!"APPROVED".equals(tx.getStatus().name())) {
            // 기능: 트랜잭션 상태 전이 검증
            throw new BusinessException(ErrorCode.PAYMENT_PG_ERROR, "KakaoPay cancel invalid tx status=" + tx.getStatus().name());
        }

        int cancelAmount = payment.getAmount().intValue(); // 현재 금액이 정수라는 전제(테스트)

        KakaoPayCancelRequest cancelReq = new KakaoPayCancelRequest(
                props.cid(),
                tx.getPgTid(),
                cancelAmount,
                0
        );

        log.info("[KakaoPay][CANCEL] paymentId={}, tid={}, cancelAmount={}",
                payment.getPaymentId(),
                tx.getPgTid(),
                cancelAmount);

        try {
            KakaoPayCancelResponse res = client.cancel(cancelReq);
            tx.markCancelled(client.toJson(res));
            return true;
        } catch (RestClientResponseException e) {
            log.error("[KakaoPay][CANCEL][ERROR] status={}, body={}",
                    e.getRawStatusCode(),
                    e.getResponseBodyAsString(),
                    e);
            tx.markFailed(e.getResponseBodyAsString());
            return false;
        } catch (Exception e) {
            log.error("[KakaoPay][CANCEL][UNEXPECTED]", e);
            tx.markFailed(e.toString());
            return false;
        }
    }


    private void validateKakaoPay(Payment payment) {
        if (payment.getPaymentMethod() != PaymentProvider.KAKAOPAY) {
            // 기능: 결제수단 검증
            throw new BusinessException(ErrorCode.PAYMENT_PG_ERROR, "KakaoPay method required");
        }
    }

    private void validateKakaoPayConfig() {
        String secret = props.secretKey();
        if (secret == null || secret.isBlank()
                || "__MISSING__".equals(secret)
                || secret.contains("$")) {
            throw new BusinessException(
                    ErrorCode.PAYMENT_PG_ERROR,
                    "KakaoPay secret key is missing"
            );
        }
    }

    /**
     * 카카오 API가 정수 금액을 요구하는 경우가 많아서 방어적으로 처리.
     * - 소수점이 들어오면 예외로 막아버림(정책). 필요하면 반올림/절삭 정책으로 바꿔.
     */
    private int toIntAmount(BigDecimal amount) {
        // 기능: 금액 검증
        if (amount == null) throw new BusinessException(ErrorCode.VALIDATION_FAILED, "amount is required");
        if (amount.scale() > 0 && amount.stripTrailingZeros().scale() > 0) {
            throw new BusinessException(ErrorCode.VALIDATION_FAILED, "amount must be integer");
        }
        return amount.intValueExact();
    }
}
