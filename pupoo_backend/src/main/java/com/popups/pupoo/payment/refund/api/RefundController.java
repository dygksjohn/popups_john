package com.popups.pupoo.payment.refund.api;

import com.popups.pupoo.common.api.ApiResponse;
import com.popups.pupoo.payment.refund.application.RefundService;
import com.popups.pupoo.payment.refund.dto.*;
import org.springframework.data.domain.*;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api")
public class RefundController {

    private final RefundService refundService;
    
    private Long currentUserId() {
        var auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth == null || auth.getPrincipal() == null) {
            throw new IllegalStateException("Unauthenticated");
        }
        Object principal = auth.getPrincipal();
        if (principal instanceof Long id) return id;

        // 혹시 문자열로 들어오는 케이스 방어
        if (principal instanceof String s) return Long.valueOf(s);

        throw new IllegalStateException("Unexpected principal type: " + principal.getClass());
    }


    public RefundController(RefundService refundService) {
        this.refundService = refundService;
    }

    @PostMapping("/refunds")
    public ApiResponse<RefundResponse> requestRefund(@RequestBody RefundRequest req) {
        Long userId = 1L; // TODO: SecurityContext에서 주입
        return ApiResponse.success(refundService.requestRefund(userId, req));
    }

    @GetMapping("/refunds/my")
    public ApiResponse<Page<RefundResponse>> myRefunds(Pageable pageable) {
        Long userId = 1L; // TODO: SecurityContext에서 주입
        return ApiResponse.success(refundService.myRefunds(userId, pageable));
    }
}
