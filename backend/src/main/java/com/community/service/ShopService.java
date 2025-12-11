package com.community.service;

import com.community.dto.*;
import com.community.model.*;
import com.community.repository.*;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class ShopService {

    private final ShopItemRepository shopItemRepository;
    private final ItemCategoryRepository categoryRepository;
    private final UserInventoryRepository userInventoryRepository;
    private final UserRepository userRepository;

    // ============ 아이템 관리 ============

    @Transactional(readOnly = true)
    public List<ShopItemDTO> getAllItems() {
        return shopItemRepository.findAll().stream()
                .map(this::convertToItemDTO)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public ShopItemDTO getItemById(Long id) {
        ShopItem item = shopItemRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("아이템을 찾을 수 없습니다: " + id));
        return convertToItemDTO(item);
    }

    @Transactional
    public ShopItemDTO createItem(ShopItemDTO dto) {
        ShopItem item = new ShopItem();
        updateItemFromDTO(item, dto);
        ShopItem saved = shopItemRepository.save(item);
        return convertToItemDTO(saved);
    }

    @Transactional
    public ShopItemDTO updateItem(Long id, ShopItemDTO dto) {
        ShopItem item = shopItemRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("아이템을 찾을 수 없습니다: " + id));
        updateItemFromDTO(item, dto);
        ShopItem updated = shopItemRepository.save(item);
        return convertToItemDTO(updated);
    }

    @Transactional
    public void deleteItem(Long id) {
        if (!shopItemRepository.existsById(id)) {
            throw new RuntimeException("아이템을 찾을 수 없습니다: " + id);
        }
        shopItemRepository.deleteById(id);
    }

    // ============ 카테고리 관리 ============

    @Transactional(readOnly = true)
    public List<ItemCategoryDTO> getAllCategories() {
        return categoryRepository.findAllByOrderByDisplayOrderAsc().stream()
                .map(this::convertToCategoryDTO)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public ItemCategoryDTO getCategoryById(Long id) {
        ItemCategory category = categoryRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("카테고리를 찾을 수 없습니다: " + id));
        return convertToCategoryDTO(category);
    }

    @Transactional
    public ItemCategoryDTO createCategory(ItemCategoryDTO dto) {
        ItemCategory category = new ItemCategory();
        updateCategoryFromDTO(category, dto);
        ItemCategory saved = categoryRepository.save(category);
        return convertToCategoryDTO(saved);
    }

    @Transactional
    public ItemCategoryDTO updateCategory(Long id, ItemCategoryDTO dto) {
        ItemCategory category = categoryRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("카테고리를 찾을 수 없습니다: " + id));
        updateCategoryFromDTO(category, dto);
        ItemCategory updated = categoryRepository.save(category);
        return convertToCategoryDTO(updated);
    }

    @Transactional
    public void deleteCategory(Long id) {
        if (!categoryRepository.existsById(id)) {
            throw new RuntimeException("카테고리를 찾을 수 없습니다: " + id);
        }
        categoryRepository.deleteById(id);
    }

    // ============ 변환 메서드 ============

    private ShopItemDTO convertToItemDTO(ShopItem item) {
        return new ShopItemDTO(
                item.getId(),
                item.getName(),
                item.getDescription(),
                item.getCategory() != null ? item.getCategory().getId() : null,
                item.getPrice(),
                item.getImageUrl(),
                item.getModelUrl(),
                item.getItemType() != null ? item.getItemType().name() : null,
                item.getIsActive()
        );
    }

    private void updateItemFromDTO(ShopItem item, ShopItemDTO dto) {
        item.setName(dto.getName());
        item.setDescription(dto.getDescription());

        if (dto.getCategoryId() != null) {
            ItemCategory category = categoryRepository.findById(dto.getCategoryId())
                    .orElse(null);
            item.setCategory(category);
        }

        item.setPrice(dto.getPrice());
        item.setImageUrl(dto.getImageUrl());
        item.setModelUrl(dto.getModelUrl());

        if (dto.getItemType() != null) {
            item.setItemType(ShopItem.ItemType.valueOf(dto.getItemType()));
        }

        item.setIsActive(dto.getIsActive());
    }

    private ItemCategoryDTO convertToCategoryDTO(ItemCategory category) {
        return new ItemCategoryDTO(
                category.getId(),
                category.getName(),
                category.getDescription(),
                category.getDisplayOrder(),
                category.getIsActive()
        );
    }

    private void updateCategoryFromDTO(ItemCategory category, ItemCategoryDTO dto) {
        category.setName(dto.getName());
        category.setDescription(dto.getDescription());
        category.setDisplayOrder(dto.getDisplayOrder());
        category.setIsActive(dto.getIsActive());
    }

    // ============ 유저 상점 기능 ============

    /**
     * 활성화된 상점 아이템 조회 (유저용)
     */
    @Transactional(readOnly = true)
    public List<ShopItemDTO> getActiveShopItems() {
        return shopItemRepository.findByIsActiveTrueOrderByCreatedAtDesc()
                .stream()
                .map(this::convertToItemDTO)
                .collect(Collectors.toList());
    }

    /**
     * 카테고리별 활성화된 상점 아이템 조회
     */
    @Transactional(readOnly = true)
    public List<ShopItemDTO> getShopItemsByCategory(Long categoryId) {
        return shopItemRepository.findByCategoryIdAndIsActiveTrue(categoryId)
                .stream()
                .map(this::convertToItemDTO)
                .collect(Collectors.toList());
    }

    /**
     * 활성화된 카테고리 조회 (유저용)
     */
    @Transactional(readOnly = true)
    public List<ItemCategoryDTO> getActiveCategories() {
        return categoryRepository.findByIsActiveTrueOrderByDisplayOrderAsc()
                .stream()
                .map(this::convertToCategoryDTO)
                .collect(Collectors.toList());
    }

    /**
     * 사용자의 인벤토리 조회
     */
    @Transactional(readOnly = true)
    public List<UserInventoryDTO> getUserInventory(Long userId) {
        return userInventoryRepository.findByUserId(userId)
                .stream()
                .map(this::convertToInventoryDTO)
                .collect(Collectors.toList());
    }

    /**
     * 사용자의 신규 아이템 조회
     */
    @Transactional(readOnly = true)
    public List<UserInventoryDTO> getUserNewItems(Long userId) {
        return userInventoryRepository.findByUserIdAndIsNewTrue(userId)
                .stream()
                .map(this::convertToInventoryDTO)
                .collect(Collectors.toList());
    }

    /**
     * 아이템 구매
     */
    @Transactional
    public PurchaseResponse purchaseItem(Long userId, PurchaseRequest request) {
        // 사용자 조회
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found"));

        // 아이템 조회
        ShopItem shopItem = shopItemRepository.findById(request.getShopItemId())
                .orElseThrow(() -> new RuntimeException("Item not found"));

        // 아이템 활성화 여부 확인
        if (!shopItem.getIsActive()) {
            return PurchaseResponse.builder()
                    .success(false)
                    .message("This item is no longer available")
                    .build();
        }

        // 중복 구매 확인
        if (userInventoryRepository.existsByUserIdAndShopItemId(userId, request.getShopItemId())) {
            return PurchaseResponse.builder()
                    .success(false)
                    .message("You already own this item")
                    .build();
        }

        // 잔액 확인 (실버 코인 기준)
        if (user.getSilverCoins() < shopItem.getPrice()) {
            return PurchaseResponse.builder()
                    .success(false)
                    .message("Insufficient silver coins")
                    .remainingSilverCoins(user.getSilverCoins())
                    .remainingGoldCoins(user.getGoldCoins())
                    .build();
        }

        // 코인 차감
        user.setSilverCoins(user.getSilverCoins() - shopItem.getPrice());
        userRepository.save(user);

        // 인벤토리에 추가
        UserInventory inventory = new UserInventory();
        inventory.setUser(user);
        inventory.setShopItem(shopItem);
        inventory.setPurchasedAt(LocalDateTime.now());
        inventory.setIsEquipped(request.getAutoEquip());
        inventory.setIsNew(true);
        inventory.setViewedAt(null);

        UserInventory savedInventory = userInventoryRepository.save(inventory);

        return PurchaseResponse.builder()
                .success(true)
                .message("Purchase successful")
                .purchasedItem(convertToInventoryDTO(savedInventory))
                .remainingSilverCoins(user.getSilverCoins())
                .remainingGoldCoins(user.getGoldCoins())
                .build();
    }

    /**
     * 아이템 착용/해제
     */
    @Transactional
    public void toggleEquipItem(Long userId, Long inventoryId) {
        UserInventory inventory = userInventoryRepository.findById(inventoryId)
                .orElseThrow(() -> new RuntimeException("Inventory item not found"));

        if (!inventory.getUser().getId().equals(userId)) {
            throw new RuntimeException("Unauthorized");
        }

        inventory.setIsEquipped(!inventory.getIsEquipped());
        userInventoryRepository.save(inventory);
    }

    /**
     * 신규 아이템 확인 (is_new를 false로 설정)
     */
    @Transactional
    public void markItemAsViewed(Long userId, Long inventoryId) {
        UserInventory inventory = userInventoryRepository.findById(inventoryId)
                .orElseThrow(() -> new RuntimeException("Inventory item not found"));

        if (!inventory.getUser().getId().equals(userId)) {
            throw new RuntimeException("Unauthorized");
        }

        if (inventory.getIsNew()) {
            inventory.setIsNew(false);
            inventory.setViewedAt(LocalDateTime.now());
            userInventoryRepository.save(inventory);
        }
    }

    private UserInventoryDTO convertToInventoryDTO(UserInventory inventory) {
        UserInventoryDTO dto = new UserInventoryDTO();
        dto.setId(inventory.getId());
        dto.setUserId(inventory.getUser().getId());
        dto.setShopItemId(inventory.getShopItem().getId());
        dto.setShopItem(convertToItemDTO(inventory.getShopItem()));
        dto.setPurchasedAt(inventory.getPurchasedAt());
        dto.setIsEquipped(inventory.getIsEquipped());
        dto.setIsNew(inventory.getIsNew());
        dto.setViewedAt(inventory.getViewedAt());
        return dto;
    }
}
