package com.community.dto;

import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class PurchaseRequest {
    private Long shopItemId;
    private String currencyType = "SILVER"; // 사용할 화폐 타입 (SILVER 또는 GOLD)
    private Boolean autoEquip = false; // 구매 후 즉시 착용 여부
}
