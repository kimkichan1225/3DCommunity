package com.community.controller;

import com.community.dto.ItemCategoryDTO;
import com.community.dto.ShopItemDTO;
import com.community.service.ShopService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/admin")
@RequiredArgsConstructor
@PreAuthorize("hasAnyRole('ADMIN', 'DEVELOPER')")
public class ShopController {

    private final ShopService shopService;

    // ============ 아이템 API ============

    @GetMapping("/shop-items")
    public ResponseEntity<List<ShopItemDTO>> getAllItems() {
        return ResponseEntity.ok(shopService.getAllItems());
    }

    @GetMapping("/shop-items/{id}")
    public ResponseEntity<ShopItemDTO> getItemById(@PathVariable Long id) {
        return ResponseEntity.ok(shopService.getItemById(id));
    }

    @PostMapping("/shop-items")
    public ResponseEntity<ShopItemDTO> createItem(@RequestBody ShopItemDTO dto) {
        return ResponseEntity.ok(shopService.createItem(dto));
    }

    @PutMapping("/shop-items/{id}")
    public ResponseEntity<ShopItemDTO> updateItem(@PathVariable Long id, @RequestBody ShopItemDTO dto) {
        return ResponseEntity.ok(shopService.updateItem(id, dto));
    }

    @DeleteMapping("/shop-items/{id}")
    public ResponseEntity<Void> deleteItem(@PathVariable Long id) {
        shopService.deleteItem(id);
        return ResponseEntity.noContent().build();
    }

    // ============ 카테고리 API ============

    @GetMapping("/item-categories")
    public ResponseEntity<List<ItemCategoryDTO>> getAllCategories() {
        return ResponseEntity.ok(shopService.getAllCategories());
    }

    @GetMapping("/item-categories/{id}")
    public ResponseEntity<ItemCategoryDTO> getCategoryById(@PathVariable Long id) {
        return ResponseEntity.ok(shopService.getCategoryById(id));
    }

    @PostMapping("/item-categories")
    public ResponseEntity<ItemCategoryDTO> createCategory(@RequestBody ItemCategoryDTO dto) {
        return ResponseEntity.ok(shopService.createCategory(dto));
    }

    @PutMapping("/item-categories/{id}")
    public ResponseEntity<ItemCategoryDTO> updateCategory(@PathVariable Long id, @RequestBody ItemCategoryDTO dto) {
        return ResponseEntity.ok(shopService.updateCategory(id, dto));
    }

    @DeleteMapping("/item-categories/{id}")
    public ResponseEntity<Void> deleteCategory(@PathVariable Long id) {
        shopService.deleteCategory(id);
        return ResponseEntity.noContent().build();
    }
}
