package com.community.controller;

import com.community.dto.ProfileItemDto;
import com.community.dto.ProfileSelectionDto;
import com.community.model.User;
import com.community.model.enums.ItemType;
import com.community.service.ProfileItemService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/profile")
@RequiredArgsConstructor
public class ProfileItemController {

    private final ProfileItemService profileItemService;

    /**
     * 사용자의 모든 프로필 아이템 조회
     */
    @GetMapping("/items")
    public ResponseEntity<List<ProfileItemDto>> getUserProfileItems(
            @AuthenticationPrincipal User user
    ) {
        List<ProfileItemDto> items = profileItemService.getUserProfileItems(user.getId());
        return ResponseEntity.ok(items);
    }

    /**
     * 특정 타입의 프로필 아이템 조회
     */
    @GetMapping("/items/{type}")
    public ResponseEntity<List<ProfileItemDto>> getUserProfileItemsByType(
            @AuthenticationPrincipal User user,
            @PathVariable String type
    ) {
        ItemType itemType = ItemType.valueOf(type.toUpperCase());
        List<ProfileItemDto> items = profileItemService.getUserProfileItemsByType(user.getId(), itemType);
        return ResponseEntity.ok(items);
    }

    /**
     * 아이템 잠금해제
     */
    @PostMapping("/items/{itemId}/unlock")
    public ResponseEntity<ProfileItemDto> unlockItem(
            @AuthenticationPrincipal User user,
            @PathVariable Long itemId
    ) {
        ProfileItemDto item = profileItemService.unlockItem(user.getId(), itemId);
        return ResponseEntity.ok(item);
    }

    /**
     * 프로필 이미지/테두리 선택
     */
    @PutMapping("/select")
    public ResponseEntity<Void> selectProfileItems(
            @AuthenticationPrincipal User user,
            @RequestBody ProfileSelectionDto selectionDto
    ) {
        profileItemService.selectProfileItems(user.getId(), selectionDto);
        return ResponseEntity.ok().build();
    }
}
