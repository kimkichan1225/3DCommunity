package com.community.controller;

import com.community.dto.*;
import com.community.model.User;
import com.community.service.PaymentService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@Slf4j
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
        try {
            log.info("직접 결제 요청 수신: {}", request);
            log.info("Authentication: {}", authentication);

            if (authentication == null || authentication.getPrincipal() == null) {
                log.warn("인증 정보 없음");
                return ResponseEntity.status(401).body(
                    PaymentResponseDTO.builder()
                        .success(false)
                        .message("Authentication required")
                        .build()
                );
            }

            User user = (User) authentication.getPrincipal();
            log.info("사용자 ID: {}, 금액: {}, 주문ID: {}", user.getId(), request.getAmount(), request.getOrderId());

            PaymentResponseDTO response = paymentService.createDirectPaymentRequest(user.getId(), request);
            log.info("결제 요청 생성 완료: {}", response);

            return ResponseEntity.ok(response);
        } catch (Exception e) {
            log.error("결제 요청 생성 중 오류 발생", e);
            return ResponseEntity.status(500).body(
                PaymentResponseDTO.builder()
                    .success(false)
                    .message("Internal server error: " + e.getMessage())
                    .build()
            );
        }
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
     * 특정 주문의 결제 상태 조회
     */
    @GetMapping("/status/{orderId}")
    public ResponseEntity<PaymentResponseDTO> getPaymentStatus(
            @PathVariable String orderId,
            Authentication authentication) {
        User user = (User) authentication.getPrincipal();
        return ResponseEntity.ok(paymentService.getPaymentStatus(user.getId(), orderId));
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
