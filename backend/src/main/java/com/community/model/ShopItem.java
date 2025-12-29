package com.community.model;

import jakarta.persistence.*;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;
import java.time.LocalDateTime;

@Entity
@Table(name = "shop_items")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class ShopItem {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, length = 200)
    private String name;

    @Column(columnDefinition = "TEXT")
    private String description;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "category_id")
    private ItemCategory category;

    @Column(nullable = false)
    private Integer price = 0;

    @Column(name = "silver_coin_price")
    private Integer silverCoinPrice = 0;

    @Column(name = "gold_coin_price")
    private Integer goldCoinPrice = 0;

    @Column(name = "image_url", length = 500)
    private String imageUrl;

    @Column(name = "model_url", length = 500)
    private String modelUrl;

    @Enumerated(EnumType.STRING)
    @Column(name = "item_type", length = 50)
    private ItemType itemType = ItemType.ACCESSORY;

    @Column(name = "is_active")
    private Boolean isActive = true;

    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;

    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
        updatedAt = LocalDateTime.now();
    }

    @PreUpdate
    protected void onUpdate() {
        updatedAt = LocalDateTime.now();
    }

    public enum ItemType {
        ACCESSORY,
        CLOTHING,
        HAIR,
        AVATAR,
        OTHER
    }
}
