package com.community.config;

import com.community.model.*;
import com.community.model.enums.ItemType;
import com.community.model.enums.UnlockConditionType;
import com.community.repository.BoardRepository;
import com.community.repository.ProfileItemRepository;
import com.community.repository.UserProfileItemRepository;
import com.community.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

@Component
@RequiredArgsConstructor
public class DataInitializer implements CommandLineRunner {

    private final BoardRepository boardRepository;
    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final ProfileItemRepository profileItemRepository;
    private final UserProfileItemRepository userProfileItemRepository;

    @Override
    public void run(String... args) {
        // 자유게시판이 없으면 생성
        if (!boardRepository.existsByName("자유게시판")) {
            Board freeBoard = Board.builder()
                    .name("자유게시판")
                    .description("자유롭게 글을 쓰는 공간입니다.")
                    .category(Board.BoardCategory.FREE)
                    .build();
            boardRepository.save(freeBoard);
            System.out.println("기본 게시판 생성 완료: 자유게시판");
        }

        // 공지사항 게시판이 없으면 생성 (임시로 FREE 카테고리 사용)
        if (!boardRepository.existsByName("공지사항")) {
            Board noticeBoard = Board.builder()
                    .name("공지사항")
                    .description("중요한 공지사항을 확인하세요.")
                    .category(Board.BoardCategory.FREE) // 임시로 FREE 사용
                    .build();
            boardRepository.save(noticeBoard);
            System.out.println("공지사항 게시판 생성 완료 (카테고리: FREE)");
        }

        // 테스트 계정 생성
        if (!userRepository.existsByEmail("test@test.com")) {
            User testUser = User.builder()
                    .username("테스트유저")
                    .email("test@test.com")
                    .password(passwordEncoder.encode("test1234"))
                    .role(Role.ROLE_USER)
                    .build();
            userRepository.save(testUser);
            System.out.println("테스트 계정 생성 완료: test@test.com / test1234");
        }

        // 관리자 계정 생성
        if (!userRepository.existsByEmail("admin@admin.com")) {
            User adminUser = User.builder()
                    .username("관리자")
                    .email("admin@admin.com")
                    .password(passwordEncoder.encode("admin1234"))
                    .role(Role.ROLE_DEVELOPER)
                    .build();
            userRepository.save(adminUser);
            System.out.println("관리자 계정 생성 완료: admin@admin.com / admin1234");
        }

        // 기본 프로필 아이템 생성
        initializeProfileItems();
    }

    private void initializeProfileItems() {
        // 기본 프로필 이미지 (base-profile1, 2, 3)
        createProfileItemIfNotExists(
            "base-profile1",
            "기본 프로필 1",
            "/resources/Profile/base-profile1.png",
            ItemType.PROFILE,
            true,
            UnlockConditionType.NONE,
            null,
            1
        );

        createProfileItemIfNotExists(
            "base-profile2",
            "기본 프로필 2",
            "/resources/Profile/base-profile2.png",
            ItemType.PROFILE,
            true,
            UnlockConditionType.NONE,
            null,
            2
        );

        createProfileItemIfNotExists(
            "base-profile3",
            "기본 프로필 3",
            "/resources/Profile/base-profile3.png",
            ItemType.PROFILE,
            true,
            UnlockConditionType.NONE,
            null,
            3
        );

        // 기본 테두리 (base-outline1, 2, 3 - 기본 제공)
        createProfileItemIfNotExists(
            "base-outline1",
            "기본 테두리 1",
            "/resources/ProfileOutline/base-outline1.png",
            ItemType.OUTLINE,
            true,
            UnlockConditionType.NONE,
            null,
            1
        );

        createProfileItemIfNotExists(
            "base-outline2",
            "기본 테두리 2",
            "/resources/ProfileOutline/base-outline2.png",
            ItemType.OUTLINE,
            true,
            UnlockConditionType.NONE,
            null,
            2
        );

        createProfileItemIfNotExists(
            "base-outline3",
            "기본 테두리 3",
            "/resources/ProfileOutline/base-outline3.png",
            ItemType.OUTLINE,
            true,
            UnlockConditionType.NONE,
            null,
            3
        );

        // 잠금 테두리 (base-outline4, 5, 6 - 조건부 해금)
        createProfileItemIfNotExists(
            "base-outline4",
            "골드 테두리",
            "/resources/ProfileOutline/base-outline4.png",
            ItemType.OUTLINE,
            false,
            UnlockConditionType.POST_COUNT,
            "{\"value\": 10, \"description\": \"게시글 10개 작성\"}",
            4
        );

        createProfileItemIfNotExists(
            "base-outline5",
            "실버 테두리",
            "/resources/ProfileOutline/base-outline5.png",
            ItemType.OUTLINE,
            false,
            UnlockConditionType.COMMENT_COUNT,
            "{\"value\": 50, \"description\": \"댓글 50개 작성\"}",
            5
        );

        createProfileItemIfNotExists(
            "base-outline6",
            "다이아몬드 테두리",
            "/resources/ProfileOutline/base-outline6.png",
            ItemType.OUTLINE,
            false,
            UnlockConditionType.LOGIN_DAYS,
            "{\"value\": 7, \"description\": \"7일 연속 로그인\"}",
            6
        );

        // 모든 사용자에게 기본 아이템 자동 지급
        grantDefaultItemsToAllUsers();
    }

    private void createProfileItemIfNotExists(
        String itemCode,
        String itemName,
        String imagePath,
        ItemType itemType,
        boolean isDefault,
        UnlockConditionType conditionType,
        String conditionValue,
        int displayOrder
    ) {
        if (profileItemRepository.findByItemCode(itemCode).isEmpty()) {
            ProfileItem item = new ProfileItem();
            item.setItemCode(itemCode);
            item.setItemName(itemName);
            item.setImagePath(imagePath);
            item.setItemType(itemType);
            item.setIsDefault(isDefault);
            item.setUnlockConditionType(conditionType);
            item.setUnlockConditionValue(conditionValue);
            item.setDisplayOrder(displayOrder);
            profileItemRepository.save(item);
            System.out.println("프로필 아이템 생성 완료: " + itemName);
        }
    }

    private void grantDefaultItemsToAllUsers() {
        // 기본 제공 아이템 조회
        var defaultItems = profileItemRepository.findByIsDefaultTrue();

        // 모든 사용자 조회
        var allUsers = userRepository.findAll();

        for (User user : allUsers) {
            for (ProfileItem item : defaultItems) {
                // 이미 보유하고 있는지 확인
                if (!userProfileItemRepository.existsByUserIdAndProfileItemId(user.getId(), item.getId())) {
                    UserProfileItem userItem = new UserProfileItem();
                    userItem.setUser(user);
                    userItem.setProfileItem(item);
                    userProfileItemRepository.save(userItem);
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

        System.out.println("모든 사용자에게 기본 아이템 지급 완료");
    }
}
