package com.community.service;

import com.community.dto.BoardDto;
import com.community.model.Board;
import com.community.repository.BoardRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class BoardService {

    private final BoardRepository boardRepository;

    // 게시판 생성
    @Transactional
    public BoardDto.Response createBoard(BoardDto.CreateRequest request) {
        if (boardRepository.existsByName(request.getName())) {
            throw new IllegalArgumentException("이미 존재하는 게시판 이름입니다.");
        }

        Board board = Board.builder()
                .name(request.getName())
                .description(request.getDescription())
                .category(Board.BoardCategory.valueOf(request.getCategory()))
                .build();

        Board savedBoard = boardRepository.save(board);
        return BoardDto.Response.from(savedBoard);
    }

    // 게시판 목록 조회
    public List<BoardDto.Response> getAllBoards() {
        return boardRepository.findAll().stream()
                .map(BoardDto.Response::from)
                .collect(Collectors.toList());
    }

    // 게시판 상세 조회
    public BoardDto.Response getBoard(Long boardId) {
        Board board = boardRepository.findById(boardId)
                .orElseThrow(() -> new IllegalArgumentException("게시판을 찾을 수 없습니다."));
        return BoardDto.Response.from(board);
    }
}
