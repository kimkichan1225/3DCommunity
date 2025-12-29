package com.community.dto;

import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class ShopItemDTO {
    private Long id;
    private String name;
    private String description;
    private Long categoryId;
    private ItemCategoryDTO category; // 카테고리 전체 정보 추가
    private Integer price;
    private String imageUrl;
    private String modelUrl;
    private String itemType;
    private Boolean isActive;
}
