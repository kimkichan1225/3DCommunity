package com.community.dto;

import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;
import lombok.Builder;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class DirectPaymentRequestDTO {
    private Integer goldAmount;
    private String orderId;
    private Integer amount;
}
