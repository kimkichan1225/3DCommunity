package com.community.service;

import com.community.dto.ItemCategoryDTO;
import com.community.dto.ShopItemDTO;
import com.community.model.ItemCategory;
import com.community.model.ShopItem;
import com.community.repository.ItemCategoryRepository;
import com.community.repository.ShopItemRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class ShopService {

    private final ShopItemRepository shopItemRepository;
    private final ItemCategoryRepository categoryRepository;

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
}
