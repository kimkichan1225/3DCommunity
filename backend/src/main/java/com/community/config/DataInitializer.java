package com.community.config;

import com.community.model.Board;
import com.community.model.User;
import com.community.repository.BoardRepository;
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

        // 테스트 계정 생성
        if (!userRepository.existsByEmail("test@test.com")) {
            User testUser = User.builder()
                    .username("테스트유저")
                    .email("test@test.com")
                    .password(passwordEncoder.encode("test1234"))
                    .role("ROLE_USER")
                    .build();
            userRepository.save(testUser);
            System.out.println("테스트 계정 생성 완료: test@test.com / test1234");
        }
    }
}
