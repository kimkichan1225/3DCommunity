package com.community.dto;

import com.community.model.ProfileItem;
import com.community.model.enums.ItemType;
import com.community.model.enums.UnlockConditionType;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ProfileItemDto {

    private Long id;
    private ItemType itemType;
    private String itemCode;
    private String itemName;
    private String imagePath;
    private Boolean isDefault;
    private UnlockConditionType unlockConditionType;
    private String unlockConditionValue;
    private Integer displayOrder;
    private LocalDateTime createdAt;

    // 사용자 관련 추가 정보
    private Boolean isUnlocked;  // 사용자가 잠금해제했는지
    private Boolean isSelected;  // 사용자가 현재 선택했는지
    private LocalDateTime unlockedAt;  // 잠금해제 시간

    // Entity -> DTO 변환
    public static ProfileItemDto fromEntity(ProfileItem item) {
        return ProfileItemDto.builder()
                .id(item.getId())
                .itemType(item.getItemType())
                .itemCode(item.getItemCode())
                .itemName(item.getItemName())
                .imagePath(item.getImagePath())
                .isDefault(item.getIsDefault())
                .unlockConditionType(item.getUnlockConditionType())
                .unlockConditionValue(item.getUnlockConditionValue())
                .displayOrder(item.getDisplayOrder())
                .createdAt(item.getCreatedAt())
                .isUnlocked(false)
                .isSelected(false)
                .build();
    }

    // DTO -> Entity 변환 (생성용)
    public ProfileItem toEntity() {
        ProfileItem item = new ProfileItem();
        item.setItemType(this.itemType);
        item.setItemCode(this.itemCode);
        item.setItemName(this.itemName);
        item.setImagePath(this.imagePath);
        item.setIsDefault(this.isDefault != null ? this.isDefault : false);
        item.setUnlockConditionType(this.unlockConditionType);
        item.setUnlockConditionValue(this.unlockConditionValue);
        item.setDisplayOrder(this.displayOrder != null ? this.displayOrder : 0);
        return item;
    }
}
