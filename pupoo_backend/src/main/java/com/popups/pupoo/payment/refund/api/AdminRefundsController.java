package com.popups.pupoo.payment.refund.api;

import com.popups.pupoo.common.api.ApiResponse;
import com.popups.pupoo.payment.refund.application.RefundAdminService;
import com.popups.pupoo.payment.refund.dto.RefundResponse;
import com.popups.pupoo.payment.refund.persistence.RefundRepository;
import org.springframework.data.domain.*;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/admin")
public class AdminRefundsController {

    private final RefundRepository refundRepository;
    private final RefundAdminService refundAdminService;

    public AdminRefundsController(RefundRepository refundRepository, RefundAdminService refundAdminService) {
        this.refundRepository = refundRepository;
        this.refundAdminService = refundAdminService;
    }

    @GetMapping("/refunds")
    public ApiResponse<Page<RefundResponse>> refunds(Pageable pageable) {
        return ApiResponse.success(refundRepository.findAll(pageable).map(RefundResponse::from));
    }

    @GetMapping("/refunds/{id}")
    public ApiResponse<RefundResponse> refund(@PathVariable Long id) {
        return ApiResponse.success(refundRepository.findById(id)
                .map(RefundResponse::from)
                .orElseThrow(() -> new IllegalArgumentException("Refund not found: " + id)));
    }

    @PatchMapping("/refunds/{refundId}")
    public ApiResponse<RefundResponse> approveRefund(@PathVariable Long refundId) {
        return ApiResponse.success(refundAdminService.approveAndComplete(refundId));
    }
}
