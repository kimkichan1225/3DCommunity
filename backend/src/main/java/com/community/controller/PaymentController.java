package com.community.controller;

import com.community.dto.*;
import com.community.model.User;
import com.community.service.PaymentService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/payment")
@RequiredArgsConstructor
public class PaymentController {

    private final PaymentService paymentService;

    /**
     * 활성화된 금화 패키지 목록 조회
     */
    @GetMapping("/packages")
    public ResponseEntity<List<GoldPackageDTO>> getActiveGoldPackages() {
        return ResponseEntity.ok(paymentService.getActiveGoldPackages());
    }

    /**
     * 금화 패키지 상세 조회
     */
    @GetMapping("/packages/{id}")
    public ResponseEntity<GoldPackageDTO> getGoldPackageById(@PathVariable Long id) {
        return ResponseEntity.ok(paymentService.getGoldPackageById(id));
    }

    /**
     * 결제 요청 생성
     */
    @PostMapping("/request")
    public ResponseEntity<PaymentResponseDTO> createPaymentRequest(
            @RequestBody PaymentRequestDTO request,
            Authentication authentication) {
        User user = (User) authentication.getPrincipal();
        return ResponseEntity.ok(paymentService.createPaymentRequest(user.getId(), request));
    }

    /**
     * 직접 결제 요청 생성 (패키지 없이)
     */
    @PostMapping("/direct-request")
    public ResponseEntity<PaymentResponseDTO> createDirectPaymentRequest(
            @RequestBody DirectPaymentRequestDTO request,
            Authentication authentication) {
        User user = (User) authentication.getPrincipal();
        return ResponseEntity.ok(paymentService.createDirectPaymentRequest(user.getId(), request));
    }

    /**
     * 결제 승인 (토스페이먼츠 콜백)
     */
    @PostMapping("/approve")
    public ResponseEntity<PaymentResponseDTO> approvePayment(
            @RequestBody PaymentApproveRequestDTO request,
            Authentication authentication) {
        User user = (User) authentication.getPrincipal();
        return ResponseEntity.ok(paymentService.approvePayment(user.getId(), request));
    }

    /**
     * 내 결제 내역 조회
     */
    @GetMapping("/history")
    public ResponseEntity<List<PaymentHistoryDTO>> getMyPaymentHistory(Authentication authentication) {
        User user = (User) authentication.getPrincipal();
        return ResponseEntity.ok(paymentService.getMyPaymentHistory(user.getId()));
    }
}
