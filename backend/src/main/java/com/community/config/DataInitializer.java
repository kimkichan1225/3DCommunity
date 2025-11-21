package com.community.config;

import com.community.model.Board;
import com.community.repository.BoardRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.boot.CommandLineRunner;
import org.springframework.stereotype.Component;

@Component
@RequiredArgsConstructor
public class DataInitializer implements CommandLineRunner {

    private final BoardRepository boardRepository;

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
    }
}
