package com.community.controller;

import com.community.dto.AuthResponse;
import com.community.dto.LoginRequest;
import com.community.dto.RegisterRequest;
import com.community.dto.UserDto;
import com.community.model.User;
import com.community.service.ActiveUserService;
import com.community.service.AuthService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.Map;

@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
public class AuthController {

    private final AuthService authService;
    private final ActiveUserService activeUserService;

    @PostMapping("/register")
    public ResponseEntity<?> register(@Valid @RequestBody RegisterRequest request) {
        try {
            AuthResponse response = authService.register(request);
            return ResponseEntity.ok(response);
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(
                    AuthResponse.builder()
                            .message(e.getMessage())
                            .build()
            );
        }
    }

    @PostMapping("/login")
    public ResponseEntity<?> login(@Valid @RequestBody LoginRequest request) {
        try {
            AuthResponse response = authService.login(request);
            return ResponseEntity.ok(response);
        } catch (RuntimeException e) {
            e.printStackTrace(); // 콘솔에 에러 출력
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(
                    AuthResponse.builder()
                            .message(e.getMessage())
                            .build()
            );
        }
    }

    @GetMapping("/test")
    public ResponseEntity<String> test() {
        return ResponseEntity.ok("인증 API 서버가 정상 작동 중입니다.");
    }

    /**
     * 현재 로그인한 사용자 정보 조회 (프로필 정보 포함)
     */
    @GetMapping("/me")
    public ResponseEntity<UserDto> getCurrentUser(@AuthenticationPrincipal User user) {
        if (user == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        }
        UserDto userDto = UserDto.fromEntity(user);
        return ResponseEntity.ok(userDto);
    }

    /**
     * 로그아웃 (활성 사용자 목록에서 제거)
     */
    @PostMapping("/logout")
    public ResponseEntity<?> logout(@AuthenticationPrincipal User user) {
        if (user == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        }

        String userId = user.getId().toString();
        activeUserService.removeUserById(userId);

        Map<String, String> response = new HashMap<>();
        response.put("message", "로그아웃되었습니다.");
        return ResponseEntity.ok(response);
    }

    /**
     * 현재 온라인 인원 수 조회
     */
    @GetMapping("/online-count")
    public ResponseEntity<Map<String, Integer>> getOnlineCount() {
        Map<String, Integer> response = new HashMap<>();
        response.put("count", activeUserService.getActiveUserCount());
        return ResponseEntity.ok(response);
    }

    /**
     * 사용자 접속 중 여부 확인
     */
    @GetMapping("/is-active/{userId}")
    public ResponseEntity<Map<String, Boolean>> isUserActive(@PathVariable String userId) {
        Map<String, Boolean> response = new HashMap<>();
        response.put("isActive", activeUserService.isUserActive(userId));
        return ResponseEntity.ok(response);
    }
}
