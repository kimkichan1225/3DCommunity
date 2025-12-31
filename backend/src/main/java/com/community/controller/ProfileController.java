package com.community.controller;

import com.community.dto.UserDto;
import com.community.model.Profile;
import com.community.model.User;
import com.community.repository.ProfileRepository;
import com.community.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.Map;

@RestController
@RequestMapping("/api/profile")
@RequiredArgsConstructor
public class ProfileController {

    private final UserRepository userRepository;
    private final ProfileRepository profileRepository;

    /**
     * 특정 사용자의 프로필 조회 (다른 사용자 프로필 보기)
     */
    @GetMapping("/{userId}")
    public ResponseEntity<?> getUserProfile(@PathVariable Long userId) {
        try {
            User user = userRepository.findById(userId)
                    .orElseThrow(() -> new RuntimeException("사용자를 찾을 수 없습니다."));

            Profile profile = profileRepository.findByUserId(userId)
                    .orElse(null);

            Map<String, Object> response = new HashMap<>();
            response.put("id", user.getId());
            response.put("nickname", user.getNickname());
            response.put("level", profile != null ? profile.getLevel() : 1);
            response.put("statusMessage", profile != null ? profile.getStatusMessage() : "");

            // 프로필 이미지 경로 추가 (User 엔티티의 ProfileItem 관계 사용)
            response.put("selectedProfile", user.getSelectedProfile() != null ? user.getSelectedProfile().getImagePath() : null);
            response.put("selectedOutline", user.getSelectedOutline() != null ? user.getSelectedOutline().getImagePath() : null);

            return ResponseEntity.ok(response);
        } catch (RuntimeException e) {
            Map<String, String> error = new HashMap<>();
            error.put("message", e.getMessage());
            return ResponseEntity.badRequest().body(error);
        }
    }

    /**
     * 현재 사용자의 프로필 업데이트
     */
    @PutMapping
    public ResponseEntity<?> updateProfile(
            @AuthenticationPrincipal User currentUser,
            @RequestBody Map<String, Object> updates
    ) {
        try {
            Profile profile = profileRepository.findByUserId(currentUser.getId())
                    .orElseGet(() -> {
                        Profile newProfile = new Profile();
                        newProfile.setUser(currentUser);
                        newProfile.setLevel(1);
                        return newProfile;
                    });

            // 사용자명 업데이트
            if (updates.containsKey("username")) {
                String newUsername = (String) updates.get("username");

                // 사용자명 중복 확인 (현재 사용자 제외)
                if (!newUsername.equals(currentUser.getUsername())) {
                    boolean exists = userRepository.findByUsername(newUsername).isPresent();
                    if (exists) {
                        Map<String, String> error = new HashMap<>();
                        error.put("message", "이미 사용 중인 닉네임입니다.");
                        return ResponseEntity.badRequest().body(error);
                    }
                }

                currentUser.setUsername(newUsername);
                userRepository.save(currentUser);
            }

            // 상태 메시지 업데이트
            if (updates.containsKey("statusMessage")) {
                profile.setStatusMessage((String) updates.get("statusMessage"));
            }

            // 선택한 프로필 업데이트
            if (updates.containsKey("selectedProfile")) {
                profile.setSelectedProfile((Integer) updates.get("selectedProfile"));
            }

            // 선택한 아웃라인 업데이트
            if (updates.containsKey("selectedOutline")) {
                profile.setSelectedOutline((Integer) updates.get("selectedOutline"));
            }

            profileRepository.save(profile);

            Map<String, Object> response = new HashMap<>();
            response.put("id", currentUser.getId());
            response.put("username", currentUser.getUsername());
            response.put("level", profile.getLevel());
            response.put("statusMessage", profile.getStatusMessage());
            response.put("selectedProfile", profile.getSelectedProfile());
            response.put("selectedOutline", profile.getSelectedOutline());

            return ResponseEntity.ok(response);
        } catch (Exception e) {
            Map<String, String> error = new HashMap<>();
            error.put("message", "프로필 업데이트 실패: " + e.getMessage());
            return ResponseEntity.badRequest().body(error);
        }
    }
}
