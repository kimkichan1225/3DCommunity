package com.community.dto;

import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;
import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class UserInventoryDTO {
    private Long id;
    private Long userId;
    private Long shopItemId;
    private ShopItemDTO shopItem; // 상점 아이템 정보 포함
    private LocalDateTime purchasedAt;
    private Boolean isEquipped;
    private Boolean isNew;
    private LocalDateTime viewedAt;
}
