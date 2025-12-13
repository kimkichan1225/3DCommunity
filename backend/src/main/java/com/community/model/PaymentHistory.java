package com.community.model;

import jakarta.persistence.*;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;
import lombok.Builder;

import java.time.LocalDateTime;

@Entity
@Table(name = "payment_history")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class PaymentHistory {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "gold_package_id", nullable = true)
    private GoldPackage goldPackage;

    @Column(nullable = false, unique = true, length = 200)
    private String orderId; // 주문 ID (고유값)

    @Column(length = 200)
    private String paymentKey; // 토스페이먼츠 결제 키

    @Column(nullable = false)
    private Integer amount; // 결제 금액 (원)

    @Column(nullable = false)
    private Integer goldAmount; // 지급한 금화 개수

    @Column(nullable = false, length = 20)
    @Enumerated(EnumType.STRING)
    private PaymentStatus status; // 결제 상태

    @Column(length = 50)
    private String paymentMethod; // 결제 수단 (카드)

    @Column(length = 100)
    private String cardCompany; // 카드사

    @Column(length = 20)
    private String cardNumber; // 카드 번호 마스킹 (예: 1234-****-****-5678)

    @Column(columnDefinition = "TEXT")
    private String failReason; // 실패 사유

    @Column(nullable = false, updatable = false)
    private LocalDateTime createdAt = LocalDateTime.now();

    @Column
    private LocalDateTime approvedAt; // 승인 시각

    @Column
    private LocalDateTime canceledAt; // 취소 시각

    public enum PaymentStatus {
        PENDING,    // 결제 대기
        APPROVED,   // 승인 완료
        FAILED,     // 결제 실패
        CANCELED    // 취소됨
    }

    @PrePersist
    public void prePersist() {
        if (this.status == null) {
            this.status = PaymentStatus.PENDING;
        }
    }
}
