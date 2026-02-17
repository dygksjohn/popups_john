package com.popups.pupoo.payment.api;

import com.popups.pupoo.common.api.ApiResponse;
import com.popups.pupoo.payment.dto.PaymentResponse;
import com.popups.pupoo.payment.persistence.PaymentRepository;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/admin")
public class AdminPaymentsController {

    private final PaymentRepository paymentRepository;

    public AdminPaymentsController(PaymentRepository paymentRepository) {
        this.paymentRepository = paymentRepository;
    }

    @GetMapping("/payments")
    public ApiResponse<Page<PaymentResponse>> payments(Pageable pageable) {
        return ApiResponse.success(
                paymentRepository.findAll(pageable).map(PaymentResponse::from)
        );
    }

    @GetMapping("/payments/{id}")
    public ApiResponse<PaymentResponse> payment(@PathVariable Long id) {
        return ApiResponse.success(
                paymentRepository.findById(id)
                        .map(PaymentResponse::from)
                        .orElseThrow(() -> new IllegalArgumentException("Payment not found: " + id))
        );
    }
}
