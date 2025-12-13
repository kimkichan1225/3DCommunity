package com.community.dto;

import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;
import lombok.Builder;

import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class PaymentHistoryDTO {
    private Long id;
    private Long userId;
    private String username;
    private GoldPackageDTO goldPackage;
    private String orderId;
    private String paymentKey;
    private Integer amount;
    private Integer goldAmount;
    private String status;
    private String paymentMethod;
    private String cardCompany;
    private String cardNumber;
    private String failReason;
    private LocalDateTime createdAt;
    private LocalDateTime approvedAt;
    private LocalDateTime canceledAt;
}
