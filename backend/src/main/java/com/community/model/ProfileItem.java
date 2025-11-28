package com.community.model;

import com.community.model.enums.ItemType;
import com.community.model.enums.UnlockConditionType;
import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Entity
@Table(name = "profile_items")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class ProfileItem {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private ItemType itemType;  // PROFILE or OUTLINE

    @Column(nullable = false, unique = true, length = 50)
    private String itemCode;  // 'base-profile1', 'base-outline1', etc.

    @Column(nullable = false, length = 100)
    private String itemName;  // 표시 이름

    @Column(nullable = false)
    private String imagePath;  // '/resources/Profile/base-profile1.png'

    @Column(nullable = false)
    private Boolean isDefault = false;  // 기본 제공 아이템 여부

    @Enumerated(EnumType.STRING)
    @Column(length = 50)
    private UnlockConditionType unlockConditionType;  // 조건 타입

    @Column(length = 500)
    private String unlockConditionValue;  // 조건 값 (JSON 형태 저장)

    @Column(nullable = false)
    private Integer displayOrder = 0;  // 표시 순서

    @Column(nullable = false, updatable = false)
    private LocalDateTime createdAt = LocalDateTime.now();

    @PrePersist
    protected void onCreate() {
        if (createdAt == null) {
            createdAt = LocalDateTime.now();
        }
        if (isDefault == null) {
            isDefault = false;
        }
        if (displayOrder == null) {
            displayOrder = 0;
        }
    }
}
