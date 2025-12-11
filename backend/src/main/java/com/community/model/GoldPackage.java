package com.community.model;

import jakarta.persistence.*;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;
import lombok.Builder;

import java.time.LocalDateTime;

@Entity
@Table(name = "gold_packages")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class GoldPackage {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, length = 100)
    private String name;

    @Column(columnDefinition = "TEXT")
    private String description;

    @Column(nullable = false)
    private Integer goldAmount; // 지급할 금화 개수

    @Column(nullable = false)
    private Integer price; // 실제 가격 (원)

    @Column(nullable = false)
    private Integer bonusGold = 0; // 보너스 금화 (이벤트 등)

    @Column(length = 255)
    private String imageUrl; // 상품 이미지 URL

    @Column(nullable = false)
    private Boolean isActive = true; // 판매 활성화 여부

    @Column(nullable = false)
    private Boolean isPopular = false; // 인기 상품 표시

    @Column(nullable = false)
    private Integer displayOrder = 0; // 표시 순서

    @Column(nullable = false, updatable = false)
    private LocalDateTime createdAt = LocalDateTime.now();

    @Column(nullable = false)
    private LocalDateTime updatedAt = LocalDateTime.now();

    @PreUpdate
    public void preUpdate() {
        this.updatedAt = LocalDateTime.now();
    }

    /**
     * 총 지급 금화 (기본 금화 + 보너스 금화)
     */
    public Integer getTotalGold() {
        return goldAmount + bonusGold;
    }
}
