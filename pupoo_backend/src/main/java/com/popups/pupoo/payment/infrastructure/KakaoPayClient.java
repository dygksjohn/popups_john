package com.popups.pupoo.payment.infrastructure;

import com.fasterxml.jackson.databind.ObjectMapper;

import org.springframework.context.annotation.Profile;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Component;
import org.springframework.util.LinkedMultiValueMap;
import org.springframework.util.MultiValueMap;
import org.springframework.web.client.HttpStatusCodeException;
import org.springframework.web.client.RestClient;

@Profile("!test")
@Component
public class KakaoPayClient {

    private final RestClient restClient;
    private final KakaoPayProperties props;
    private final ObjectMapper objectMapper = new ObjectMapper();
    
    

    public KakaoPayClient(RestClient.Builder builder, KakaoPayProperties props) {
        this.props = props;

        // ✅ 1) secretKey 주입 여부/치환 실패 감지 (시크릿 값 노출 없음)
        String secret = props.secretKey();
        if (secret == null || secret.isBlank() || secret.contains("$") || "__MISSING__".equals(secret)) {
            throw new IllegalStateException(
                    "KakaoPay secretKey is missing or not resolved. " +
                    "Check environment variable KAKAOPAY_SECRET_KEY_DEV (Eclipse Run Config > Environment)."
            );
        }

        String auth = props.authorizationPrefix() + secret;

        // ✅ 2) 디버그 로그(시크릿 노출 없음)
        System.out.println("[KakaoPay] authPrefix=" + props.authorizationPrefix()
                + ", secretLen=" + secret.length()
                + ", authContains$=" + auth.contains("$"));

        this.restClient = builder
                .baseUrl(props.baseUrl())
                .defaultHeader("Authorization", auth)
                .build();
    }


    public KakaoPayReadyResponse ready(KakaoPayReadyRequest req) {
        try {
            return restClient.post()
                    .uri(props.readyPath())
                    .contentType(MediaType.APPLICATION_JSON)
                    .accept(MediaType.APPLICATION_JSON)
                    .body(req)
                    .retrieve()
                    .body(KakaoPayReadyResponse.class);
        } catch (HttpStatusCodeException e) {
            System.out.println("[KakaoPay][READY][ERROR] status=" + e.getStatusCode()
                    + ", body=" + e.getResponseBodyAsString());
            throw e;
        }
    }

    public KakaoPayApproveResponse approve(KakaoPayApproveRequest req) {
        try {
            return restClient.post()
                    .uri(props.approvePath())
                    .contentType(MediaType.APPLICATION_JSON)
                    .accept(MediaType.APPLICATION_JSON)
                    .body(req)
                    .retrieve()
                    .body(KakaoPayApproveResponse.class);
        } catch (HttpStatusCodeException e) {
            System.out.println("[KakaoPay][APPROVE][ERROR] status=" + e.getStatusCode()
                    + ", body=" + e.getResponseBodyAsString());
            throw e;
        }
    }

    public KakaoPayCancelResponse cancel(KakaoPayCancelRequest req) {
        try {
            return restClient.post()
                    .uri(props.cancelPath())
                    .contentType(MediaType.APPLICATION_JSON)
                    .accept(MediaType.APPLICATION_JSON)
                    .body(req)
                    .retrieve()
                    .body(KakaoPayCancelResponse.class);
        } catch (HttpStatusCodeException e) {
            System.out.println("[KakaoPay][CANCEL][ERROR] status=" + e.getStatusCode()
                    + ", body=" + e.getResponseBodyAsString());
            throw e;
        }
    }

    private MultiValueMap<String, String> toForm(KakaoPayReadyRequest r) {
        MultiValueMap<String, String> f = new LinkedMultiValueMap<>();
        f.add("cid", r.cid());
        f.add("partner_order_id", r.partner_order_id());
        f.add("partner_user_id", r.partner_user_id());
        f.add("item_name", r.item_name());
        f.add("quantity", String.valueOf(r.quantity()));
        f.add("total_amount", String.valueOf(r.total_amount()));
        f.add("tax_free_amount", String.valueOf(r.tax_free_amount()));
        f.add("approval_url", r.approval_url());
        f.add("cancel_url", r.cancel_url());
        f.add("fail_url", r.fail_url());
        return f;
    }

    private MultiValueMap<String, String> toForm(KakaoPayApproveRequest r) {
        MultiValueMap<String, String> f = new LinkedMultiValueMap<>();
        f.add("cid", r.cid());
        f.add("tid", r.tid());
        f.add("partner_order_id", r.partner_order_id());
        f.add("partner_user_id", r.partner_user_id());
        f.add("pg_token", r.pg_token());
        return f;
    }

    private MultiValueMap<String, String> toForm(KakaoPayCancelRequest r) {
        MultiValueMap<String, String> f = new LinkedMultiValueMap<>();
        f.add("cid", r.cid());
        f.add("tid", r.tid());
        f.add("cancel_amount", String.valueOf(r.cancel_amount()));
        f.add("cancel_tax_free_amount", String.valueOf(r.cancel_tax_free_amount()));
        return f;
    }

    public String toJson(Object o) {
        try { return objectMapper.writeValueAsString(o); }
        catch (Exception e) { return "{\"_error\":\"json serialize failed\"}"; }
    }
}
