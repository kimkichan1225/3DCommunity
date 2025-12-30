package com.community.controller;

import com.community.dto.ProfileItemDto;
import com.community.dto.UnlockConditionDto;
import com.community.service.ProfileItemService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/admin/profile-items")
@RequiredArgsConstructor
@PreAuthorize("hasRole('DEVELOPER')")
public class AdminProfileController {

    private final ProfileItemService profileItemService;

    /**
     * 모든 프로필 아이템 조회
     */
    @GetMapping
    public ResponseEntity<List<ProfileItemDto>> getAllProfileItems() {
        List<ProfileItemDto> items = profileItemService.getAllProfileItems();
        return ResponseEntity.ok(items);
    }

    /**
     * 프로필 아이템 생성
     */
    @PostMapping
    public ResponseEntity<ProfileItemDto> createProfileItem(@RequestBody ProfileItemDto dto) {
        ProfileItemDto created = profileItemService.createProfileItem(dto);
        return ResponseEntity.ok(created);
    }

    /**
     * 프로필 아이템 수정
     */
    @PutMapping("/{id}")
    public ResponseEntity<ProfileItemDto> updateProfileItem(
            @PathVariable Long id,
            @RequestBody ProfileItemDto dto
    ) {
        ProfileItemDto updated = profileItemService.updateProfileItem(id, dto);
        return ResponseEntity.ok(updated);
    }

    /**
     * 프로필 아이템 삭제
     */
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteProfileItem(@PathVariable Long id) {
        profileItemService.deleteProfileItem(id);
        return ResponseEntity.ok().build();
    }

    /**
     * 잠금해제 조건 타입 목록 조회
     */
    @GetMapping("/unlock-conditions")
    public ResponseEntity<UnlockConditionDto[]> getUnlockConditionTypes() {
        return ResponseEntity.ok(UnlockConditionDto.getAllConditionTypes());
    }

    /**
     * 모든 사용자에게 기본 아이템 지급
     */
    @PostMapping("/grant-default-items")
    public ResponseEntity<String> grantDefaultItemsToAllUsers() {
        int grantedCount = profileItemService.grantDefaultItemsToAllUsers();
        return ResponseEntity.ok("총 " + grantedCount + "개의 아이템이 지급되었습니다.");
    }

    /**
     * 기존 아바타 보유자들에게 프로필 아이템 소급 지급
     */
    @PostMapping("/grant-avatar-profile-items")
    public ResponseEntity<String> grantProfileItemsForExistingAvatars() {
        int grantedCount = profileItemService.grantProfileItemsForExistingAvatars();
        return ResponseEntity.ok("총 " + grantedCount + "개의 프로필 아이템이 소급 지급되었습니다.");
    }
}
