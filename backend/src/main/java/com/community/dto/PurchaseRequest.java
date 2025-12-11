package com.community.dto;

import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class PurchaseRequest {
    private Long shopItemId;
    private Boolean autoEquip = false; // 구매 후 즉시 착용 여부
}
