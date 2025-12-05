package com.community.dto;

import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class ItemCategoryDTO {
    private Long id;
    private String name;
    private String description;
    private Integer displayOrder;
    private Boolean isActive;
}
