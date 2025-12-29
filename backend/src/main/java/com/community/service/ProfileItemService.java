package com.community.service;

import com.community.dto.ProfileItemDto;
import com.community.dto.ProfileSelectionDto;
import com.community.model.ProfileItem;
import com.community.model.User;
import com.community.model.UserProfileItem;
import com.community.model.enums.ItemType;
import com.community.model.enums.UnlockConditionType;
import com.community.repository.ProfileItemRepository;
import com.community.repository.UserProfileItemRepository;
import com.community.repository.UserRepository;
import com.community.repository.UserInventoryRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class ProfileItemService {

    private final ProfileItemRepository profileItemRepository;
    private final UserProfileItemRepository userProfileItemRepository;
    private final UserRepository userRepository;
    private final UserInventoryRepository userInventoryRepository;

    /**
     * 사용자의 보유 아이템 목록 조회 (잠금 상태 포함)
     */
    @Transactional(readOnly = true)
    public List<ProfileItemDto> getUserProfileItems(Long userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("사용자를 찾을 수 없습니다."));

        List<ProfileItem> allItems = profileItemRepository.findAllByOrderByDisplayOrderAsc();
        List<UserProfileItem> userItems = userProfileItemRepository.findByUserId(userId);

        return allItems.stream().map(item -> {
            ProfileItemDto dto = ProfileItemDto.fromEntity(item);

            // 잠금해제 여부 확인
            userItems.stream()
                    .filter(ui -> ui.getProfileItem().getId().equals(item.getId()))
                    .findFirst()
                    .ifPresent(ui -> {
                        dto.setIsUnlocked(true);
                        dto.setUnlockedAt(ui.getUnlockedAt());
                    });

            // 선택 여부 확인
            if (item.getItemType() == ItemType.PROFILE &&
                user.getSelectedProfile() != null &&
                user.getSelectedProfile().getId().equals(item.getId())) {
                dto.setIsSelected(true);
            } else if (item.getItemType() == ItemType.OUTLINE &&
                       user.getSelectedOutline() != null &&
                       user.getSelectedOutline().getId().equals(item.getId())) {
                dto.setIsSelected(true);
            }

            return dto;
        }).collect(Collectors.toList());
    }

    /**
     * 특정 타입의 사용자 보유 아이템 조회
     */
    @Transactional(readOnly = true)
    public List<ProfileItemDto> getUserProfileItemsByType(Long userId, ItemType itemType) {
        return getUserProfileItems(userId).stream()
                .filter(item -> item.getItemType() == itemType)
                .collect(Collectors.toList());
    }

    /**
     * 아이템 잠금해제
     */
    @Transactional
    public ProfileItemDto unlockItem(Long userId, Long itemId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("사용자를 찾을 수 없습니다."));

        ProfileItem item = profileItemRepository.findById(itemId)
                .orElseThrow(() -> new RuntimeException("아이템을 찾을 수 없습니다."));

        // 이미 보유 중인지 확인
        if (userProfileItemRepository.existsByUserIdAndProfileItemId(userId, itemId)) {
            throw new RuntimeException("이미 보유한 아이템입니다.");
        }

        // 조건 체크
        if (!checkUnlockCondition(user, item)) {
            throw new RuntimeException("잠금해제 조건을 만족하지 않습니다.");
        }

        // 아이템 잠금해제
        UserProfileItem userItem = new UserProfileItem();
        userItem.setUser(user);
        userItem.setProfileItem(item);
        userProfileItemRepository.save(userItem);

        ProfileItemDto dto = ProfileItemDto.fromEntity(item);
        dto.setIsUnlocked(true);
        dto.setUnlockedAt(userItem.getUnlockedAt());

        return dto;
    }

    /**
     * 아바타 구매 시 자동으로 프로필 아이템 해금 (조건 체크 없이)
     */
    @Transactional
    public void unlockProfileItemByAvatarName(Long userId, String avatarName) {
        try {
            User user = userRepository.findById(userId)
                    .orElseThrow(() -> new RuntimeException("사용자를 찾을 수 없습니다."));

            // 아바타 이름에 해당하는 프로필 아이템 찾기
            // 예: "Casual Male" -> "Casual_Male-profile"
            String profileImageName = avatarName.replace(" ", "_") + "-profile";

            // imagePath에 해당 이름이 포함된 PROFILE 타입 아이템 찾기
            ProfileItem profileItem = profileItemRepository.findAll().stream()
                    .filter(item -> item.getItemType() == ItemType.PROFILE &&
                            item.getImagePath() != null &&
                            item.getImagePath().contains(profileImageName))
                    .findFirst()
                    .orElse(null);

            if (profileItem == null) {
                System.out.println("⚠️ 프로필 아이템을 찾을 수 없습니다: " + profileImageName);
                return;
            }

            // 이미 보유 중인지 확인
            if (userProfileItemRepository.existsByUserIdAndProfileItemId(userId, profileItem.getId())) {
                System.out.println("ℹ️ 이미 보유한 프로필 아이템입니다: " + profileItem.getItemName());
                return;
            }

            // 프로필 아이템 자동 해금
            UserProfileItem userItem = new UserProfileItem();
            userItem.setUser(user);
            userItem.setProfileItem(profileItem);
            userProfileItemRepository.save(userItem);

            System.out.println("✅ 프로필 아이템 자동 해금 성공: " + profileItem.getItemName());

        } catch (Exception e) {
            System.err.println("⚠️ 프로필 아이템 자동 해금 실패: " + e.getMessage());
            // 에러가 발생해도 아바타 구매는 정상적으로 완료되도록 함
        }
    }

    /**
     * 프로필 이미지/테두리 선택
     */
    @Transactional
    public void selectProfileItems(Long userId, ProfileSelectionDto selectionDto) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("사용자를 찾을 수 없습니다."));

        // 프로필 이미지 선택
        if (selectionDto.getSelectedProfileId() != null) {
            ProfileItem profileItem = profileItemRepository.findById(selectionDto.getSelectedProfileId())
                    .orElseThrow(() -> new RuntimeException("프로필 이미지를 찾을 수 없습니다."));

            if (profileItem.getItemType() != ItemType.PROFILE) {
                throw new RuntimeException("프로필 이미지가 아닙니다.");
            }

            // 보유 여부 확인
            if (!userProfileItemRepository.existsByUserIdAndProfileItemId(userId, profileItem.getId())) {
                throw new RuntimeException("보유하지 않은 프로필 이미지입니다.");
            }

            user.setSelectedProfile(profileItem);
        }

        // 테두리 선택
        if (selectionDto.getSelectedOutlineId() != null) {
            ProfileItem outlineItem = profileItemRepository.findById(selectionDto.getSelectedOutlineId())
                    .orElseThrow(() -> new RuntimeException("테두리를 찾을 수 없습니다."));

            if (outlineItem.getItemType() != ItemType.OUTLINE) {
                throw new RuntimeException("테두리가 아닙니다.");
            }

            // 보유 여부 확인
            if (!userProfileItemRepository.existsByUserIdAndProfileItemId(userId, outlineItem.getId())) {
                throw new RuntimeException("보유하지 않은 테두리입니다.");
            }

            user.setSelectedOutline(outlineItem);
        }

        userRepository.save(user);
    }

    /**
     * 모든 아이템 조회 (관리자용)
     */
    @Transactional(readOnly = true)
    public List<ProfileItemDto> getAllProfileItems() {
        return profileItemRepository.findAllByOrderByDisplayOrderAsc().stream()
                .map(ProfileItemDto::fromEntity)
                .collect(Collectors.toList());
    }

    /**
     * 아이템 생성 (관리자용)
     */
    @Transactional
    public ProfileItemDto createProfileItem(ProfileItemDto dto) {
        // 중복 코드 확인
        if (profileItemRepository.findByItemCode(dto.getItemCode()).isPresent()) {
            throw new RuntimeException("이미 존재하는 아이템 코드입니다.");
        }

        ProfileItem item = dto.toEntity();
        ProfileItem saved = profileItemRepository.save(item);
        return ProfileItemDto.fromEntity(saved);
    }

    /**
     * 아이템 수정 (관리자용)
     */
    @Transactional
    public ProfileItemDto updateProfileItem(Long itemId, ProfileItemDto dto) {
        ProfileItem item = profileItemRepository.findById(itemId)
                .orElseThrow(() -> new RuntimeException("아이템을 찾을 수 없습니다."));

        // 아이템 코드 중복 확인 (자기 자신 제외)
        profileItemRepository.findByItemCode(dto.getItemCode())
                .ifPresent(existing -> {
                    if (!existing.getId().equals(itemId)) {
                        throw new RuntimeException("이미 존재하는 아이템 코드입니다.");
                    }
                });

        item.setItemType(dto.getItemType());
        item.setItemCode(dto.getItemCode());
        item.setItemName(dto.getItemName());
        item.setImagePath(dto.getImagePath());
        item.setIsDefault(dto.getIsDefault());
        item.setUnlockConditionType(dto.getUnlockConditionType());
        item.setUnlockConditionValue(dto.getUnlockConditionValue());
        item.setDisplayOrder(dto.getDisplayOrder());

        ProfileItem updated = profileItemRepository.save(item);
        return ProfileItemDto.fromEntity(updated);
    }

    /**
     * 아이템 삭제 (관리자용)
     */
    @Transactional
    public void deleteProfileItem(Long itemId) {
        ProfileItem item = profileItemRepository.findById(itemId)
                .orElseThrow(() -> new RuntimeException("아이템을 찾을 수 없습니다."));

        // 사용자가 선택 중인 아이템인지 확인
        long usersUsingItem = userRepository.findAll().stream()
                .filter(u -> (u.getSelectedProfile() != null && u.getSelectedProfile().getId().equals(itemId)) ||
                             (u.getSelectedOutline() != null && u.getSelectedOutline().getId().equals(itemId)))
                .count();

        if (usersUsingItem > 0) {
            throw new RuntimeException("현재 사용 중인 사용자가 있어 삭제할 수 없습니다.");
        }

        profileItemRepository.delete(item);
    }

    /**
     * 모든 사용자에게 기본 아이템 지급 (관리자용)
     */
    @Transactional
    public int grantDefaultItemsToAllUsers() {
        // 기본 제공 아이템 조회
        var defaultItems = profileItemRepository.findByIsDefaultTrue();

        // 모든 사용자 조회
        var allUsers = userRepository.findAll();

        int grantedCount = 0;

        for (User user : allUsers) {
            for (ProfileItem item : defaultItems) {
                // 이미 보유하고 있는지 확인
                if (!userProfileItemRepository.existsByUserIdAndProfileItemId(user.getId(), item.getId())) {
                    UserProfileItem userItem = new UserProfileItem();
                    userItem.setUser(user);
                    userItem.setProfileItem(item);
                    userProfileItemRepository.save(userItem);
                    grantedCount++;
                }
            }

            // 기본 프로필/테두리가 선택되어 있지 않으면 첫 번째 기본 아이템으로 설정
            if (user.getSelectedProfile() == null) {
                profileItemRepository.findByItemCode("base-profile1")
                    .ifPresent(user::setSelectedProfile);
            }
            if (user.getSelectedOutline() == null) {
                profileItemRepository.findByItemCode("base-outline1")
                    .ifPresent(user::setSelectedOutline);
            }
            userRepository.save(user);
        }

        return grantedCount;
    }

    /**
     * 기존 아바타 보유자들에게 프로필 아이템 소급 지급 (관리자용)
     */
    @Transactional
    public int grantProfileItemsForExistingAvatars() {
        int grantedCount = 0;

        // 모든 사용자 조회
        List<User> allUsers = userRepository.findAll();

        for (User user : allUsers) {
            // 사용자의 아바타 인벤토리 조회
            var userInventories = userInventoryRepository.findByUserId(user.getId());

            for (var inventory : userInventories) {
                if (inventory.getShopItem() != null &&
                    inventory.getShopItem().getCategory() != null &&
                    "AVATAR".equals(inventory.getShopItem().getCategory().getName())) {

                    String avatarName = inventory.getShopItem().getName();

                    // 해당 아바타의 프로필 아이템 찾기
                    String profileImageName = avatarName.replace(" ", "_") + "-profile";

                    ProfileItem profileItem = profileItemRepository.findAll().stream()
                            .filter(item -> item.getItemType() == ItemType.PROFILE &&
                                    item.getImagePath() != null &&
                                    item.getImagePath().contains(profileImageName))
                            .findFirst()
                            .orElse(null);

                    if (profileItem != null) {
                        // 이미 보유하고 있는지 확인
                        if (!userProfileItemRepository.existsByUserIdAndProfileItemId(user.getId(), profileItem.getId())) {
                            // 프로필 아이템 지급
                            UserProfileItem userItem = new UserProfileItem();
                            userItem.setUser(user);
                            userItem.setProfileItem(profileItem);
                            userProfileItemRepository.save(userItem);
                            grantedCount++;

                            System.out.println("✅ 소급 지급: " + user.getNickname() + " -> " + profileItem.getItemName());
                        }
                    }
                }
            }
        }

        return grantedCount;
    }

    /**
     * 잠금해제 조건 확인
     */
    private boolean checkUnlockCondition(User user, ProfileItem item) {
        // 조건 타입이 NONE이거나 null이면 조건 없음
        if (item.getUnlockConditionType() == null || item.getUnlockConditionType() == UnlockConditionType.NONE) {
            return true;
        }

        // AVATAR_PURCHASE 조건: 해당 아바타를 보유하고 있는지 확인
        if (item.getUnlockConditionType() == UnlockConditionType.AVATAR_PURCHASE) {
            // 아이템 코드에서 아바타 이름 추출
            // 예: "casual-male-profile" -> "Casual_Male"
            String itemCode = item.getItemCode();
            String avatarName = itemCode.replace("-profile", "")
                    .replace("-", "_");

            // 첫 글자를 대문자로 변환 (예: casual_male -> Casual_male)
            if (!avatarName.isEmpty()) {
                String[] parts = avatarName.split("_");
                StringBuilder formattedName = new StringBuilder();
                for (int i = 0; i < parts.length; i++) {
                    if (!parts[i].isEmpty()) {
                        formattedName.append(Character.toUpperCase(parts[i].charAt(0)))
                                .append(parts[i].substring(1).toLowerCase());
                        if (i < parts.length - 1) {
                            formattedName.append(" ");
                        }
                    }
                }
                avatarName = formattedName.toString();
            }

            // 사용자 인벤토리에서 해당 아바타 찾기
            boolean hasAvatar = userInventoryRepository.findByUserId(user.getId()).stream()
                    .anyMatch(inventory -> inventory.getShopItem() != null &&
                            inventory.getShopItem().getName() != null &&
                            inventory.getShopItem().getName().contains(avatarName));

            return hasAvatar;
        }

        // TODO: 다른 조건 타입들 구현 (LEVEL, POST_COUNT 등)

        // 기본적으로 false 반환 (조건 체크 미구현)
        return false;
    }
}
