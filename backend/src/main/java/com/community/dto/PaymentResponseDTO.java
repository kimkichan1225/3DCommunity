package com.community.dto;

import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;
import lombok.Builder;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class PaymentResponseDTO {
    private Boolean success;
    private String message;
    private String orderId;
    private Integer goldAmount;
    private Integer remainingGoldCoins;
    private String status;
    private PaymentHistoryDTO paymentHistory;
}
