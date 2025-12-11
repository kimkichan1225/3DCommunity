package com.community.dto;

import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;
import lombok.Builder;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class PurchaseResponse {
    private Boolean success;
    private String message;
    private UserInventoryDTO purchasedItem;
    private Integer remainingSilverCoins;
    private Integer remainingGoldCoins;
}
