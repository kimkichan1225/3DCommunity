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
    private final ProfileItemService profileItemService;

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
                item.getCategory() != null ? convertToCategoryDTO(item.getCategory()) : null,
                item.getPrice(),
                item.getImageUrl(),
                item.getModelUrl(),
                item.getItemType() != null ? item.getItemType().name() : null,
                item.getIsActive());
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
                category.getIsActive());
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
     * 이미지가 없는 아이템은 제외
     */
    @Transactional(readOnly = true)
    public List<ShopItemDTO> getActiveShopItems() {
        return shopItemRepository.findByIsActiveTrueOrderByCreatedAtDesc()
                .stream()
                .filter(item -> item.getImageUrl() != null && !item.getImageUrl().trim().isEmpty())
                .map(this::convertToItemDTO)
                .collect(Collectors.toList());
    }

    /**
     * 카테고리별 활성화된 상점 아이템 조회
     * 이미지가 없는 아이템은 제외
     */
    @Transactional(readOnly = true)
    public List<ShopItemDTO> getShopItemsByCategory(Long categoryId) {
        return shopItemRepository.findByCategoryIdAndIsActiveTrue(categoryId)
                .stream()
                .filter(item -> item.getImageUrl() != null && !item.getImageUrl().trim().isEmpty())
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

        // 아바타 구매 시 자동으로 해당 프로필 이미지 해금
        if (shopItem.getCategory() != null && "AVATAR".equals(shopItem.getCategory().getName())) {
            profileItemService.unlockProfileItemByAvatarName(userId, shopItem.getName());
        }

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
     * AVATAR 카테고리의 경우 한 번에 하나만 착용 가능
     */
    @Transactional
    public void toggleEquipItem(Long userId, Long inventoryId) {
        UserInventory inventory = userInventoryRepository.findById(inventoryId)
                .orElseThrow(() -> new RuntimeException("Inventory item not found"));

        if (!inventory.getUser().getId().equals(userId)) {
            throw new RuntimeException("Unauthorized");
        }

        boolean willBeEquipped = !inventory.getIsEquipped();

        // 착용하려는 경우
        if (willBeEquipped) {
            ShopItem shopItem = inventory.getShopItem();

            // AVATAR 카테고리인 경우, 같은 카테고리의 다른 착용 아이템 모두 해제
            if (shopItem.getCategory() != null && "AVATAR".equals(shopItem.getCategory().getName())) {
                List<UserInventory> equippedAvatars = userInventoryRepository.findByUserId(userId)
                        .stream()
                        .filter(inv -> inv.getIsEquipped() &&
                                inv.getShopItem().getCategory() != null &&
                                "AVATAR".equals(inv.getShopItem().getCategory().getName()))
                        .collect(Collectors.toList());

                // 모든 착용 중인 아바타 해제
                for (UserInventory equippedAvatar : equippedAvatars) {
                    equippedAvatar.setIsEquipped(false);
                    userInventoryRepository.save(equippedAvatar);
                }
            }
        }

        // 현재 아이템 착용/해제
        inventory.setIsEquipped(willBeEquipped);
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

    /**
     * 착용 중인 아바타 조회
     */
    @Transactional(readOnly = true)
    public UserInventoryDTO getEquippedAvatar(Long userId) {
        List<UserInventory> equippedAvatars = userInventoryRepository.findByUserId(userId).stream()
                .filter(inv -> inv.getIsEquipped() &&
                        inv.getShopItem().getCategory() != null &&
                        "AVATAR".equals(inv.getShopItem().getCategory().getName()))
                .collect(Collectors.toList());

        if (equippedAvatars.isEmpty()) {
            return null;
        }

        // 가장 최근에 구매한 착용 중인 아바타 반환
        UserInventory equipped = equippedAvatars.stream()
                .sorted((a, b) -> b.getPurchasedAt().compareTo(a.getPurchasedAt()))
                .findFirst()
                .orElse(null);

        return equipped != null ? convertToInventoryDTO(equipped) : null;
    }

    /**
     * 중복 착용 아바타 정리 (데이터베이스 정리용)
     * 여러 아바타가 착용 상태인 경우, 가장 최근에 구매한 것만 착용 상태로 유지
     */
    @Transactional
    public int cleanupDuplicateEquippedAvatars(Long userId) {
        // 사용자의 모든 착용 중인 아바타 조회
        List<UserInventory> equippedAvatars = userInventoryRepository.findByUserId(userId)
                .stream()
                .filter(inv -> inv.getIsEquipped() &&
                        inv.getShopItem().getCategory() != null &&
                        "AVATAR".equals(inv.getShopItem().getCategory().getName()))
                .sorted((a, b) -> b.getPurchasedAt().compareTo(a.getPurchasedAt())) // 최신순 정렬
                .collect(Collectors.toList());

        if (equippedAvatars.size() <= 1) {
            return 0; // 중복 없음
        }

        // 첫 번째(가장 최근) 아바타만 착용 상태 유지, 나머지는 해제
        int cleanedCount = 0;
        for (int i = 1; i < equippedAvatars.size(); i++) {
            equippedAvatars.get(i).setIsEquipped(false);
            userInventoryRepository.save(equippedAvatars.get(i));
            cleanedCount++;
        }

        return cleanedCount;
    }
}
