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
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class ProfileItemService {

    private final ProfileItemRepository profileItemRepository;
    private final UserProfileItemRepository userProfileItemRepository;
    private final UserRepository userRepository;
    private final UserInventoryRepository userInventoryRepository;
    private final ObjectMapper objectMapper;

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
            System.out.println("🔵 [자동 해금] 시작 - userId: " + userId + ", avatarName: " + avatarName);

            User user = userRepository.findById(userId)
                    .orElseThrow(() -> new RuntimeException("사용자를 찾을 수 없습니다."));

            // 아바타 이름에 해당하는 프로필 아이템 찾기
            // 예: "Casual Male" -> "Casual_Male-profile"
            String profileImageName = avatarName.replace(" ", "_") + "-profile";
            System.out.println("🔵 [자동 해금] 찾을 프로필 이미지 이름: " + profileImageName);

            // 모든 프로필 아이템 출력 (디버깅용)
            System.out.println("🔵 [자동 해금] 등록된 프로필 아이템 목록:");
            profileItemRepository.findAll().stream()
                    .filter(item -> item.getItemType() == ItemType.PROFILE)
                    .forEach(item -> System.out.println("  - " + item.getItemName() + " (imagePath: " + item.getImagePath() + ")"));

            // imagePath에 해당 이름이 포함된 PROFILE 타입 아이템 찾기
            ProfileItem profileItem = profileItemRepository.findAll().stream()
                    .filter(item -> item.getItemType() == ItemType.PROFILE &&
                            item.getImagePath() != null &&
                            item.getImagePath().contains(profileImageName))
                    .findFirst()
                    .orElse(null);

            if (profileItem == null) {
                System.err.println("❌ [자동 해금] 프로필 아이템을 찾을 수 없습니다: " + profileImageName);
                return;
            }

            System.out.println("🔵 [자동 해금] 찾은 프로필 아이템: " + profileItem.getItemName());

            // 이미 보유 중인지 확인
            if (userProfileItemRepository.existsByUserIdAndProfileItemId(userId, profileItem.getId())) {
                System.out.println("ℹ️ [자동 해금] 이미 보유한 프로필 아이템입니다: " + profileItem.getItemName());
                return;
            }

            // 프로필 아이템 자동 해금
            UserProfileItem userItem = new UserProfileItem();
            userItem.setUser(user);
            userItem.setProfileItem(profileItem);
            userProfileItemRepository.save(userItem);

            System.out.println("✅ [자동 해금] 프로필 아이템 자동 해금 성공: " + profileItem.getItemName());

        } catch (Exception e) {
            System.err.println("❌ [자동 해금] 프로필 아이템 자동 해금 실패: " + e.getMessage());
            e.printStackTrace();
            // 에러가 발생해도 아바타 구매는 정상적으로 완료되도록 함
        }
    }

    /**
     * 테두리 구매 시 자동으로 프로필 테두리 아이템 해금 (조건 체크 없이)
     */
    @Transactional
    public void unlockProfileItemByOutlineName(Long userId, String outlineName) {
        try {
            System.out.println("🟣 [테두리 해금] 시작 - userId: " + userId + ", outlineName: " + outlineName);

            User user = userRepository.findById(userId)
                    .orElseThrow(() -> new RuntimeException("사용자를 찾을 수 없습니다."));

            // 모든 테두리 아이템 출력 (디버깅용)
            System.out.println("🟣 [테두리 해금] 등록된 테두리 아이템 목록:");
            profileItemRepository.findAll().stream()
                    .filter(item -> item.getItemType() == ItemType.OUTLINE)
                    .forEach(item -> System.out.println("  - " + item.getItemName() + " (imagePath: " + item.getImagePath() + ")"));

            // imagePath에 해당 이름이 포함된 OUTLINE 타입 아이템 찾기
            ProfileItem outlineItem = profileItemRepository.findAll().stream()
                    .filter(item -> item.getItemType() == ItemType.OUTLINE &&
                            item.getImagePath() != null &&
                            item.getImagePath().contains(outlineName))
                    .findFirst()
                    .orElse(null);

            if (outlineItem == null) {
                System.err.println("❌ [테두리 해금] 테두리 아이템을 찾을 수 없습니다: " + outlineName);
                return;
            }

            System.out.println("🟣 [테두리 해금] 찾은 테두리 아이템: " + outlineItem.getItemName());

            // 이미 보유 중인지 확인
            if (userProfileItemRepository.existsByUserIdAndProfileItemId(userId, outlineItem.getId())) {
                System.out.println("ℹ️ [테두리 해금] 이미 보유한 테두리 아이템입니다: " + outlineItem.getItemName());
                return;
            }

            // 테두리 아이템 자동 해금
            UserProfileItem userItem = new UserProfileItem();
            userItem.setUser(user);
            userItem.setProfileItem(outlineItem);
            userProfileItemRepository.save(userItem);

            System.out.println("✅ [테두리 해금] 테두리 아이템 자동 해금 성공: " + outlineItem.getItemName());

        } catch (Exception e) {
            System.err.println("❌ [테두리 해금] 테두리 아이템 자동 해금 실패: " + e.getMessage());
            e.printStackTrace();
            // 에러가 발생해도 테두리 구매는 정상적으로 완료되도록 함
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
        List<User> usersUsingItem = userRepository.findAll().stream()
                .filter(u -> (u.getSelectedProfile() != null && u.getSelectedProfile().getId().equals(itemId)) ||
                             (u.getSelectedOutline() != null && u.getSelectedOutline().getId().equals(itemId)))
                .collect(Collectors.toList());

        if (!usersUsingItem.isEmpty()) {
            // 선택 중인 사용자가 있으면 해당 선택을 먼저 해제
            for (User user : usersUsingItem) {
                if (user.getSelectedProfile() != null && user.getSelectedProfile().getId().equals(itemId)) {
                    user.setSelectedProfile(null);
                }
                if (user.getSelectedOutline() != null && user.getSelectedOutline().getId().equals(itemId)) {
                    user.setSelectedOutline(null);
                }
                userRepository.save(user);
            }
        }

        // user_profile_items에서 해당 프로필 아이템을 참조하는 모든 레코드 삭제
        List<UserProfileItem> userProfileItems = userProfileItemRepository.findAll().stream()
                .filter(upi -> upi.getProfileItem().getId().equals(itemId))
                .collect(Collectors.toList());

        for (UserProfileItem userProfileItem : userProfileItems) {
            userProfileItemRepository.delete(userProfileItem);
        }

        // 프로필 아이템 삭제
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
        try {
            // 조건 타입이 NONE이거나 null이면 조건 없음
            if (item.getUnlockConditionType() == null || item.getUnlockConditionType() == UnlockConditionType.NONE) {
                return true;
            }

            // AVATAR_PURCHASE 조건: 해당 아바타를 보유하고 있는지 확인
            if (item.getUnlockConditionType() == UnlockConditionType.AVATAR_PURCHASE) {
                System.out.println("🔍 [조건 확인] 아바타 구매 조건 체크 시작");

                // 아이템 코드에서 아바타 이름 추출
                String itemCode = item.getItemCode();
                System.out.println("🔍 [조건 확인] itemCode: " + itemCode);

                if (itemCode == null || itemCode.isEmpty()) {
                    System.err.println("❌ [조건 확인] itemCode가 null 또는 빈 문자열입니다.");
                    return false;
                }

                String tempAvatarName = itemCode.replace("-profile", "")
                        .replace("-", "_");
                System.out.println("🔍 [조건 확인] tempAvatarName: " + tempAvatarName);

                // 첫 글자를 대문자로 변환 (예: casual_male -> Casual Male)
                final String avatarName;
                if (!tempAvatarName.isEmpty()) {
                    String[] parts = tempAvatarName.split("_");
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
                } else {
                    avatarName = tempAvatarName;
                }
                System.out.println("🔍 [조건 확인] 변환된 avatarName: " + avatarName);

                // 사용자 인벤토리 조회
                var userInventories = userInventoryRepository.findByUserId(user.getId());
                System.out.println("🔍 [조건 확인] 사용자 인벤토리 개수: " + userInventories.size());

                // 사용자가 보유한 아바타 목록 출력
                userInventories.stream()
                        .filter(inv -> inv.getShopItem() != null &&
                                inv.getShopItem().getCategory() != null &&
                                "AVATAR".equals(inv.getShopItem().getCategory().getName()))
                        .forEach(inv -> System.out.println("  - 보유 아바타: " + inv.getShopItem().getName() +
                                " (modelUrl: " + inv.getShopItem().getModelUrl() + ")"));

                // 사용자 인벤토리에서 해당 아바타 찾기 (modelUrl 기반)
                boolean hasAvatar = userInventories.stream()
                        .anyMatch(inventory -> {
                            if (inventory.getShopItem() == null ||
                                inventory.getShopItem().getModelUrl() == null) {
                                return false;
                            }

                            // modelUrl에서 아바타 이름 추출
                            String ownedAvatarName = extractAvatarNameFromModelUrl(inventory.getShopItem().getModelUrl());
                            boolean matches = ownedAvatarName != null && ownedAvatarName.equalsIgnoreCase(avatarName);

                            if (matches) {
                                System.out.println("  ✅ 매칭 성공: " + ownedAvatarName + " == " + avatarName);
                            }

                            return matches;
                        });

                System.out.println("🔍 [조건 확인] 아바타 보유 여부: " + hasAvatar);
                return hasAvatar;
            }

            // TODO: 다른 조건 타입들 구현 (LEVEL, POST_COUNT 등)

            // 기본적으로 false 반환 (조건 체크 미구현)
            return false;

        } catch (Exception e) {
            System.err.println("❌ [조건 확인] 에러 발생: " + e.getMessage());
            e.printStackTrace();
            return false;
        }
    }

    /**
     * 닉네임 변경권 구매 (SHOP_PURCHASE 타입 ProfileItem)
     */
    @Transactional
    public void purchaseNicknameTicket(Long userId, Long profileItemId) {
        // 사용자 조회
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("사용자를 찾을 수 없습니다."));

        // ProfileItem 조회
        ProfileItem item = profileItemRepository.findById(profileItemId)
                .orElseThrow(() -> new RuntimeException("아이템을 찾을 수 없습니다."));

        // NICKNAME_TICKET 타입인지 확인
        if (item.getItemType() != ItemType.NICKNAME_TICKET) {
            throw new RuntimeException("닉네임 변경권이 아닙니다.");
        }

        // SHOP_PURCHASE 조건인지 확인
        if (item.getUnlockConditionType() != UnlockConditionType.SHOP_PURCHASE) {
            throw new RuntimeException("구매할 수 없는 아이템입니다.");
        }

        // 가격 정보 추출 (unlockConditionValue에서 가격 정보를 가져옴)
        // JSON 형식: {"value": "100", "description": "은화 100개로 구매"}
        int price = 100; // 기본 가격
        String currencyType = "SILVER"; // 기본 화폐

        try {
            if (item.getUnlockConditionValue() != null && !item.getUnlockConditionValue().isEmpty()) {
                @SuppressWarnings("unchecked")
                Map<String, Object> json = objectMapper.readValue(item.getUnlockConditionValue(), Map.class);
                if (json.containsKey("value")) {
                    price = Integer.parseInt(json.get("value").toString());
                }
                if (json.containsKey("currencyType")) {
                    currencyType = json.get("currencyType").toString();
                }
            }
        } catch (Exception e) {
            System.err.println("가격 정보 파싱 실패, 기본값 사용: " + e.getMessage());
        }

        // 재화 확인 및 차감
        if ("GOLD".equalsIgnoreCase(currencyType)) {
            if (user.getGoldCoins() == null || user.getGoldCoins() < price) {
                throw new RuntimeException("금화가 부족합니다.");
            }
            user.setGoldCoins(user.getGoldCoins() - price);
        } else {
            if (user.getSilverCoins() == null || user.getSilverCoins() < price) {
                throw new RuntimeException("은화가 부족합니다.");
            }
            user.setSilverCoins(user.getSilverCoins() - price);
        }

        // 닉네임 변경 횟수 증가
        Integer currentChanges = user.getNicknameChangesRemaining();
        if (currentChanges == null) {
            currentChanges = 0;
        }
        user.setNicknameChangesRemaining(currentChanges + 1);

        userRepository.save(user);

        System.out.println("✅ 닉네임 변경권 구매 완료 - 사용자: " + userId + ", 남은 횟수: " + user.getNicknameChangesRemaining());
    }

    /**
     * modelUrl에서 아바타 이름 추출
     * 예: "/resources/Ultimate Animated Character Pack - Nov 2019/glTF/Soldier_Male.gltf" -> "Soldier Male"
     */
    private String extractAvatarNameFromModelUrl(String modelUrl) {
        if (modelUrl == null || modelUrl.isEmpty()) {
            return null;
        }

        try {
            // 파일명 추출 (마지막 / 이후)
            String fileName = modelUrl.substring(modelUrl.lastIndexOf('/') + 1);

            // 확장자 제거 (.gltf, .glb 등)
            String nameWithoutExt = fileName.replaceAll("\\.(gltf|glb|GLTF|GLB)$", "");

            // 언더스코어를 공백으로 변환
            String avatarName = nameWithoutExt.replace("_", " ");

            System.out.println("🔵 [아바타 이름 추출] modelUrl: " + modelUrl + " → avatarName: " + avatarName);

            return avatarName;
        } catch (Exception e) {
            System.err.println("❌ [아바타 이름 추출] 실패: " + e.getMessage());
            return null;
        }
    }
}
