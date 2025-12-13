package com.community.controller;

import com.community.dto.*;
import com.community.model.User;
import com.community.service.ShopService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/shop")
@RequiredArgsConstructor
public class UserShopController {

    private final ShopService shopService;

    /**
     * 활성화된 상점 아이템 목록 조회
     */
    @GetMapping("/items")
    public ResponseEntity<List<ShopItemDTO>> getActiveShopItems() {
        return ResponseEntity.ok(shopService.getActiveShopItems());
    }

    /**
     * 카테고리별 상점 아이템 조회
     */
    @GetMapping("/items/category/{categoryId}")
    public ResponseEntity<List<ShopItemDTO>> getShopItemsByCategory(@PathVariable Long categoryId) {
        return ResponseEntity.ok(shopService.getShopItemsByCategory(categoryId));
    }

    /**
     * 활성화된 카테고리 목록 조회
     */
    @GetMapping("/categories")
    public ResponseEntity<List<ItemCategoryDTO>> getActiveCategories() {
        return ResponseEntity.ok(shopService.getActiveCategories());
    }

    /**
     * 내 인벤토리 조회
     */
    @GetMapping("/my-inventory")
    public ResponseEntity<List<UserInventoryDTO>> getMyInventory(Authentication authentication) {
        User user = (User) authentication.getPrincipal();
        return ResponseEntity.ok(shopService.getUserInventory(user.getId()));
    }

    /**
     * 내 신규 아이템 조회 (NEW 배지 있는 아이템)
     */
    @GetMapping("/my-inventory/new")
    public ResponseEntity<List<UserInventoryDTO>> getMyNewItems(Authentication authentication) {
        User user = (User) authentication.getPrincipal();
        return ResponseEntity.ok(shopService.getUserNewItems(user.getId()));
    }

    /**
     * 아이템 구매
     */
    @PostMapping("/purchase")
    public ResponseEntity<PurchaseResponse> purchaseItem(
            @RequestBody PurchaseRequest request,
            Authentication authentication) {
        User user = (User) authentication.getPrincipal();
        return ResponseEntity.ok(shopService.purchaseItem(user.getId(), request));
    }

    /**
     * 아이템 착용/해제
     */
    @PatchMapping("/my-inventory/{inventoryId}/toggle-equip")
    public ResponseEntity<Void> toggleEquipItem(
            @PathVariable Long inventoryId,
            Authentication authentication) {
        User user = (User) authentication.getPrincipal();
        shopService.toggleEquipItem(user.getId(), inventoryId);
        return ResponseEntity.ok().build();
    }

    /**
     * 신규 아이템 확인 (NEW 배지 제거)
     */
    @PatchMapping("/my-inventory/{inventoryId}/mark-viewed")
    public ResponseEntity<Void> markItemAsViewed(
            @PathVariable Long inventoryId,
            Authentication authentication) {
        User user = (User) authentication.getPrincipal();
        shopService.markItemAsViewed(user.getId(), inventoryId);
        return ResponseEntity.ok().build();
    }
}
