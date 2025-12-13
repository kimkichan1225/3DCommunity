package com.community.dto;

import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;
import lombok.Builder;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class GoldPackageDTO {
    private Long id;
    private String name;
    private String description;
    private Integer goldAmount;
    private Integer price;
    private Integer bonusGold;
    private Integer totalGold; // goldAmount + bonusGold
    private String imageUrl;
    private Boolean isActive;
    private Boolean isPopular;
    private Integer displayOrder;
}
