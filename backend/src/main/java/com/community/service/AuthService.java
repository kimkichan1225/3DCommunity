package com.community.service;

import com.community.dto.*;
import com.community.model.Role;
import com.community.model.User;
import com.community.repository.UserRepository;
import com.community.security.JwtTokenProvider;
import lombok.RequiredArgsConstructor;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;

@Service
@RequiredArgsConstructor
public class AuthService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtTokenProvider jwtTokenProvider;
    private final AuthenticationManager authenticationManager;
    private final ActiveUserService activeUserService;

    public AuthResponse register(RegisterRequest request) {
        // 이메일 중복 체크
        if (userRepository.existsByEmail(request.getEmail())) {
            throw new RuntimeException("이미 사용 중인 이메일입니다.");
        }

        // 닉네임 중복 체크
        if (userRepository.existsByUsername(request.getUsername())) {
            throw new RuntimeException("이미 사용 중인 닉네임입니다.");
        }

        // 사용자 생성
        User user = User.builder()
                .username(request.getUsername())
                .email(request.getEmail())
                .password(passwordEncoder.encode(request.getPassword()))
                .role(Role.ROLE_USER)
                .build();

        userRepository.save(user);

        return AuthResponse.builder()
                .message("회원가입이 완료되었습니다.")
                .user(UserDto.fromEntity(user))
                .build();
    }

    public AuthResponse login(LoginRequest request) {
        // 사용자 조회
        User user = userRepository.findByEmail(request.getEmail())
                .orElseThrow(() -> new RuntimeException("사용자를 찾을 수 없습니다."));

        // 비밀번호 검증
        if (!passwordEncoder.matches(request.getPassword(), user.getPassword())) {
            throw new RuntimeException("비밀번호가 일치하지 않습니다.");
        }

        // 제재 상태 확인
        if (user.isSuspended()) {
            if (user.getIsPermanentlySuspended() != null && user.getIsPermanentlySuspended()) {
                throw new RuntimeException("영구 정지된 계정입니다. 사유: " + user.getSuspensionReason());
            } else if (user.getSuspendedUntil() != null) {
                DateTimeFormatter formatter = DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm");
                String suspendedUntil = user.getSuspendedUntil().format(formatter);
                throw new RuntimeException("계정이 일시 정지되었습니다. 정지 해제일: " + suspendedUntil + " | 사유: " + user.getSuspensionReason());
            }
        }

        // 중복 로그인 체크
        String userId = user.getId().toString();
        if (activeUserService.isUserActive(userId)) {
            throw new RuntimeException("현재 접속 중인 아이디입니다.");
        }

        // 마지막 로그인 시간 업데이트
        user.setLastLoginAt(LocalDateTime.now());
        userRepository.save(user);

        // JWT 토큰 생성
        String token = jwtTokenProvider.generateToken(user);

        return AuthResponse.builder()
                .token(token)
                .user(UserDto.fromEntity(user))
                .message("로그인 성공")
                .build();
    }

    /**
     * 닉네임 사용 가능 여부 확인
     */
    public boolean isUsernameAvailable(String username) {
        return !userRepository.existsByUsername(username);
    }
}
