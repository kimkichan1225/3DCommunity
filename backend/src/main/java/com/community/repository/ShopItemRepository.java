package com.community.repository;

import com.community.model.ShopItem;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;

@Repository
public interface ShopItemRepository extends JpaRepository<ShopItem, Long> {
    List<ShopItem> findByCategoryId(Long categoryId);
    List<ShopItem> findByIsActiveTrue();
    List<ShopItem> findByCategoryIdAndIsActiveTrue(Long categoryId);
    List<ShopItem> findAllByOrderByCreatedAtDesc();
    List<ShopItem> findByIsActiveTrueOrderByCreatedAtDesc();
}
