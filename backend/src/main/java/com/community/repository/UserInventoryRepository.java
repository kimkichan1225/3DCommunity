package com.community.repository;

import com.community.model.UserInventory;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;

@Repository
public interface UserInventoryRepository extends JpaRepository<UserInventory, Long> {
    List<UserInventory> findByUserId(Long userId);
    List<UserInventory> findByUserIdAndIsEquippedTrue(Long userId);
    boolean existsByUserIdAndShopItemId(Long userId, Long shopItemId);
}
