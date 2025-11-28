package com.community.service;

import com.community.dto.ProfileItemDto;
import com.community.dto.ProfileSelectionDto;
import com.community.model.ProfileItem;
import com.community.model.User;
import com.community.model.UserProfileItem;
import com.community.model.enums.ItemType;
import com.community.repository.ProfileItemRepository;
import com.community.repository.UserProfileItemRepository;
import com.community.repository.UserRepository;
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

        // 조건 체크 (현재는 기본 구현, 추후 UnlockConditionService로 분리)
        // TODO: 조건 검증 로직 추가

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
}
