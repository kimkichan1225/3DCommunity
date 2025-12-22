package com.community.service;

import com.community.dto.*;
import com.community.model.*;
import com.community.repository.*;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.*;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.client.RestTemplate;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

import java.nio.charset.StandardCharsets;
import java.time.LocalDateTime;
import java.util.Base64;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
public class PaymentService {

    private final GoldPackageRepository goldPackageRepository;
    private final PaymentHistoryRepository paymentHistoryRepository;
    private final UserRepository userRepository;
    private final RestTemplate restTemplate = new RestTemplate();

    @Value("${toss.payments.secret-key:test_sk_dummy}")
    private String tossSecretKey;

    @Value("${toss.payments.api-url:https://api.tosspayments.com/v1/payments}")
    private String tossApiUrl;

    // ============ 금화 패키지 관리 ============

    @Transactional(readOnly = true)
    public List<GoldPackageDTO> getActiveGoldPackages() {
        return goldPackageRepository.findByIsActiveTrueOrderByDisplayOrderAsc()
                .stream()
                .map(this::convertToGoldPackageDTO)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public GoldPackageDTO getGoldPackageById(Long id) {
        GoldPackage goldPackage = goldPackageRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Gold package not found: " + id));
        return convertToGoldPackageDTO(goldPackage);
    }

    // ============ 결제 처리 ============

    /**
     * 결제 요청 생성
     */
    @Transactional
    public PaymentResponseDTO createPaymentRequest(Long userId, PaymentRequestDTO request) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found"));

        GoldPackage goldPackage = goldPackageRepository.findById(request.getGoldPackageId())
                .orElseThrow(() -> new RuntimeException("Gold package not found"));

        if (!goldPackage.getIsActive()) {
            return PaymentResponseDTO.builder()
                    .success(false)
                    .message("This package is no longer available")
                    .build();
        }

        // 주문 ID 중복 확인
        if (paymentHistoryRepository.existsByOrderId(request.getOrderId())) {
            return PaymentResponseDTO.builder()
                    .success(false)
                    .message("Order ID already exists")
                    .build();
        }

        // 결제 내역 생성
        PaymentHistory paymentHistory = PaymentHistory.builder()
                .user(user)
                .goldPackage(goldPackage)
                .orderId(request.getOrderId())
                .amount(goldPackage.getPrice())
                .goldAmount(goldPackage.getTotalGold())
                .status(PaymentHistory.PaymentStatus.PENDING)
                .build();

        PaymentHistory saved = paymentHistoryRepository.save(paymentHistory);

        return PaymentResponseDTO.builder()
                .success(true)
                .message("Payment request created")
                .orderId(saved.getOrderId())
                .goldAmount(saved.getGoldAmount())
                .build();
    }

    /**
     * 직접 결제 요청 생성 (패키지 없이)
     */
    @Transactional
    public PaymentResponseDTO createDirectPaymentRequest(Long userId, DirectPaymentRequestDTO request) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found"));

        // 주문 ID 중복 확인
        if (paymentHistoryRepository.existsByOrderId(request.getOrderId())) {
            return PaymentResponseDTO.builder()
                    .success(false)
                    .message("Order ID already exists")
                    .build();
        }

        // 결제 내역 생성 (goldPackage 없이)
        PaymentHistory paymentHistory = PaymentHistory.builder()
                .user(user)
                .goldPackage(null) // 패키지 없음
                .orderId(request.getOrderId())
                .amount(request.getAmount())
                .goldAmount(request.getGoldAmount())
                .status(PaymentHistory.PaymentStatus.PENDING)
                .build();

        PaymentHistory saved = paymentHistoryRepository.save(paymentHistory);

        return PaymentResponseDTO.builder()
                .success(true)
                .message("Payment request created")
                .orderId(saved.getOrderId())
                .goldAmount(saved.getGoldAmount())
                .build();
    }

    /**
     * 토스페이먼츠 결제 승인
     * SERIALIZABLE 격리 수준으로 동시 요청 방지
     */
    @Transactional(isolation = org.springframework.transaction.annotation.Isolation.SERIALIZABLE)
    public PaymentResponseDTO approvePayment(Long userId, PaymentApproveRequestDTO request) {
        log.info("[PaymentService] 결제 승인 시작: orderId={}, userId={}, paymentKey={}", 
            request.getOrderId(), userId, request.getPaymentKey());
        
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found"));

        PaymentHistory paymentHistory = paymentHistoryRepository.findByOrderId(request.getOrderId())
                .orElseThrow(() -> new RuntimeException("Payment history not found"));

        // 소유권 확인
        if (!paymentHistory.getUser().getId().equals(userId)) {
            log.warn("[PaymentService] 권한 없음: orderId={}, requestUserId={}, ownerUserId={}", 
                request.getOrderId(), userId, paymentHistory.getUser().getId());
            return PaymentResponseDTO.builder()
                    .success(false)
                    .message("Unauthorized")
                    .build();
        }

        // 상태 체크 - PENDING이 아니면 이미 처리된 결제
        if (paymentHistory.getStatus() != PaymentHistory.PaymentStatus.PENDING) {
            log.warn("[PaymentService] 이미 처리된 결제: orderId={}, currentStatus={}", 
                request.getOrderId(), paymentHistory.getStatus());
            return PaymentResponseDTO.builder()
                    .success(false)
                    .message("Payment already processed: " + paymentHistory.getStatus())
                    .build();
        }

        try {
            // 토스페이먼츠 API 호출
            Map<String, Object> tossResponse = callTossPaymentsApproveAPI(request);

            // 결제 승인 성공 처리
            paymentHistory.setPaymentKey(request.getPaymentKey());
            paymentHistory.setStatus(PaymentHistory.PaymentStatus.APPROVED);
            paymentHistory.setApprovedAt(LocalDateTime.now());

            // 토스 응답에서 카드 정보 추출
            if (tossResponse.containsKey("method")) {
                paymentHistory.setPaymentMethod((String) tossResponse.get("method"));
            }
            if (tossResponse.containsKey("card")) {
                @SuppressWarnings("unchecked")
                Map<String, Object> card = (Map<String, Object>) tossResponse.get("card");
                paymentHistory.setCardCompany((String) card.get("company"));
                paymentHistory.setCardNumber((String) card.get("number"));
            }

            paymentHistoryRepository.save(paymentHistory);

            // 사용자에게 금화 지급
            user.setGoldCoins(user.getGoldCoins() + paymentHistory.getGoldAmount());
            userRepository.save(user);

            log.info("Payment approved: orderId={}, userId={}, goldAmount={}",
                    request.getOrderId(), userId, paymentHistory.getGoldAmount());

            return PaymentResponseDTO.builder()
                    .success(true)
                    .message("Payment approved successfully")
                    .orderId(paymentHistory.getOrderId())
                    .goldAmount(paymentHistory.getGoldAmount())
                    .remainingGoldCoins(user.getGoldCoins())
                    .paymentHistory(convertToPaymentHistoryDTO(paymentHistory))
                    .build();

        } catch (Exception e) {
            log.error("Payment approval failed: orderId={}, error={}", request.getOrderId(), e.getMessage());

            // 결제 실패 처리
            paymentHistory.setStatus(PaymentHistory.PaymentStatus.FAILED);
            paymentHistory.setFailReason(e.getMessage());
            paymentHistoryRepository.save(paymentHistory);

            return PaymentResponseDTO.builder()
                    .success(false)
                    .message("Payment approval failed: " + e.getMessage())
                    .orderId(paymentHistory.getOrderId())
                    .build();
        }
    }

    /**
     * 토스페이먼츠 API 호출
     */
    private Map<String, Object> callTossPaymentsApproveAPI(PaymentApproveRequestDTO request) {
        String url = tossApiUrl + "/confirm";

        // Basic Auth 헤더 생성
        String auth = tossSecretKey + ":";
        String encodedAuth = Base64.getEncoder().encodeToString(auth.getBytes(StandardCharsets.UTF_8));

        HttpHeaders headers = new HttpHeaders();
        headers.set("Authorization", "Basic " + encodedAuth);
        headers.setContentType(MediaType.APPLICATION_JSON);

        Map<String, Object> body = new HashMap<>();
        body.put("orderId", request.getOrderId());
        body.put("paymentKey", request.getPaymentKey());
        body.put("amount", request.getAmount());

        HttpEntity<Map<String, Object>> entity = new HttpEntity<>(body, headers);

        ResponseEntity<Map> response = restTemplate.exchange(
                url,
                HttpMethod.POST,
                entity,
                Map.class
        );

        if (!response.getStatusCode().is2xxSuccessful()) {
            throw new RuntimeException("Toss Payments API call failed");
        }

        @SuppressWarnings("unchecked")
        Map<String, Object> result = response.getBody();
        return result;
    }

    /**
     * 결제 내역 조회
     */
    @Transactional(readOnly = true)
    public List<PaymentHistoryDTO> getMyPaymentHistory(Long userId) {
        return paymentHistoryRepository.findByUserIdOrderByCreatedAtDesc(userId)
                .stream()
                .map(this::convertToPaymentHistoryDTO)
                .collect(Collectors.toList());
    }

    /**
     * 특정 주문의 결제 상태 조회
     */
    @Transactional(readOnly = true)
    public PaymentResponseDTO getPaymentStatus(Long userId, String orderId) {
        PaymentHistory paymentHistory = paymentHistoryRepository.findByOrderId(orderId)
                .orElseThrow(() -> new RuntimeException("Payment history not found"));

        // 소유권 확인
        if (!paymentHistory.getUser().getId().equals(userId)) {
            return PaymentResponseDTO.builder()
                    .success(false)
                    .message("Unauthorized")
                    .build();
        }

        return PaymentResponseDTO.builder()
                .success(true)
                .status(paymentHistory.getStatus().name())
                .orderId(paymentHistory.getOrderId())
                .goldAmount(paymentHistory.getGoldAmount())
                .remainingGoldCoins(paymentHistory.getUser().getGoldCoins())
                .paymentHistory(convertToPaymentHistoryDTO(paymentHistory))
                .build();
    }

    /**
     * 전체 결제 내역 조회 (Admin)
     */
    @Transactional(readOnly = true)
    public Page<PaymentHistoryDTO> getAllPaymentHistory(Pageable pageable) {
        return paymentHistoryRepository.findAll(pageable)
                .map(this::convertToPaymentHistoryDTO);
    }

    /**
     * 결제 취소 (Refund/Admin)
     */
    @Transactional
    public PaymentResponseDTO cancelPayment(String orderId, String cancelReason) {
        log.info("[PaymentService] 결제 취소 요청: orderId={}, reason={}", orderId, cancelReason);

        PaymentHistory paymentHistory = paymentHistoryRepository.findByOrderId(orderId)
                .orElseThrow(() -> new RuntimeException("Payment history not found"));

        if (paymentHistory.getStatus() != PaymentHistory.PaymentStatus.APPROVED) {
            return PaymentResponseDTO.builder()
                    .success(false)
                    .message("Only APPROVED payments can be canceled. Current status: " + paymentHistory.getStatus())
                    .build();
        }

        try {
            // 토스페이먼츠 취소 API 호출
            callTossPaymentsStatusAPI(paymentHistory.getPaymentKey(), cancelReason);

            // 상태 업데이트
            paymentHistory.setStatus(PaymentHistory.PaymentStatus.CANCELED);
            paymentHistory.setCanceledAt(LocalDateTime.now());
            paymentHistory.setFailReason("Refund: " + cancelReason);
            paymentHistoryRepository.save(paymentHistory);

            // 사용자 금화 차감
            User user = paymentHistory.getUser();
            user.setGoldCoins(user.getGoldCoins() - paymentHistory.getGoldAmount());
            userRepository.save(user);

            log.info("Payment canceled and gold deducted: orderId={}, userId={}, amount={}",
                    orderId, user.getId(), paymentHistory.getGoldAmount());

            return PaymentResponseDTO.builder()
                    .success(true)
                    .message("Payment canceled successfully")
                    .orderId(orderId)
                    .remainingGoldCoins(user.getGoldCoins())
                    .build();

        } catch (Exception e) {
            log.error("Payment cancellation failed: orderId={}, error={}", orderId, e.getMessage());
            return PaymentResponseDTO.builder()
                    .success(false)
                    .message("Cancellation failed: " + e.getMessage())
                    .build();
        }
    }

    /**
     * 토스페이먼츠 결제 취소 API
     */
    private void callTossPaymentsStatusAPI(String paymentKey, String cancelReason) {
        String url = tossApiUrl + "/" + paymentKey + "/cancel";

        // Basic Auth 헤더 생성
        String auth = tossSecretKey + ":";
        String encodedAuth = Base64.getEncoder().encodeToString(auth.getBytes(StandardCharsets.UTF_8));

        HttpHeaders headers = new HttpHeaders();
        headers.set("Authorization", "Basic " + encodedAuth);
        headers.setContentType(MediaType.APPLICATION_JSON);

        Map<String, Object> body = new HashMap<>();
        body.put("cancelReason", cancelReason);

        HttpEntity<Map<String, Object>> entity = new HttpEntity<>(body, headers);

        ResponseEntity<Map> response = restTemplate.exchange(
                url,
                HttpMethod.POST,
                entity,
                Map.class
        );

        if (!response.getStatusCode().is2xxSuccessful()) {
            throw new RuntimeException("Toss Payments Cancellation API failed");
        }
    }

    // ============ 변환 메서드 ============

    private GoldPackageDTO convertToGoldPackageDTO(GoldPackage goldPackage) {
        return GoldPackageDTO.builder()
                .id(goldPackage.getId())
                .name(goldPackage.getName())
                .description(goldPackage.getDescription())
                .goldAmount(goldPackage.getGoldAmount())
                .price(goldPackage.getPrice())
                .bonusGold(goldPackage.getBonusGold())
                .totalGold(goldPackage.getTotalGold())
                .imageUrl(goldPackage.getImageUrl())
                .isActive(goldPackage.getIsActive())
                .isPopular(goldPackage.getIsPopular())
                .displayOrder(goldPackage.getDisplayOrder())
                .build();
    }

    private PaymentHistoryDTO convertToPaymentHistoryDTO(PaymentHistory paymentHistory) {
        return PaymentHistoryDTO.builder()
                .id(paymentHistory.getId())
                .userId(paymentHistory.getUser().getId())
                .username(paymentHistory.getUser().getUsername())
                .goldPackage(paymentHistory.getGoldPackage() != null ? convertToGoldPackageDTO(paymentHistory.getGoldPackage()) : null)
                .orderId(paymentHistory.getOrderId())
                .paymentKey(paymentHistory.getPaymentKey())
                .amount(paymentHistory.getAmount())
                .goldAmount(paymentHistory.getGoldAmount())
                .status(paymentHistory.getStatus().name())
                .paymentMethod(paymentHistory.getPaymentMethod())
                .cardCompany(paymentHistory.getCardCompany())
                .cardNumber(paymentHistory.getCardNumber())
                .failReason(paymentHistory.getFailReason())
                .createdAt(paymentHistory.getCreatedAt())
                .approvedAt(paymentHistory.getApprovedAt())
                .canceledAt(paymentHistory.getCanceledAt())
                .build();
    }
}
