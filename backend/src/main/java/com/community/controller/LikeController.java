package com.community.controller;

import com.community.dto.LikeDto;
import com.community.model.Like;
import com.community.model.User;
import com.community.repository.UserRepository;
import com.community.service.LikeService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/likes")
@RequiredArgsConstructor
public class LikeController {

    private final LikeService likeService;
    private final UserRepository userRepository;

    // 좋아요 토글 (추가/취소)
    @PostMapping("/toggle")
    public ResponseEntity<?> toggleLike(
            @RequestBody LikeDto.CreateRequest request,
            @AuthenticationPrincipal UserDetails userDetails) {
        try {
            User user = userRepository.findByEmail(userDetails.getUsername())
                    .orElseThrow(() -> new IllegalArgumentException("사용자를 찾을 수 없습니다."));
            LikeDto.ToggleResponse response = likeService.toggleLike(request, user.getId());
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    // 좋아요 여부 확인
    @GetMapping("/check")
    public ResponseEntity<?> checkLike(
            @RequestParam Like.TargetType targetType,
            @RequestParam Long targetId,
            @AuthenticationPrincipal UserDetails userDetails) {
        try {
            User user = userRepository.findByEmail(userDetails.getUsername())
                    .orElseThrow(() -> new IllegalArgumentException("사용자를 찾을 수 없습니다."));
            Boolean isLiked = likeService.isLiked(targetType, targetId, user.getId());
            return ResponseEntity.ok(isLiked);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    // 좋아요 수 조회
    @GetMapping("/count")
    public ResponseEntity<?> getLikeCount(
            @RequestParam Like.TargetType targetType,
            @RequestParam Long targetId) {
        try {
            Long count = likeService.getLikeCount(targetType, targetId);
            return ResponseEntity.ok(count);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }
}
