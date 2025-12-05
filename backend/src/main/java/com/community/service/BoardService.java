package com.community.service;

import com.community.dto.BoardDto;
import com.community.model.Board;
import com.community.model.PostType;
import com.community.repository.BoardRepository;
import com.community.repository.PostRepository;
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
    private final PostRepository postRepository;

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
                .orderIndex(request.getOrderIndex() != null ? request.getOrderIndex() : 0)
                .build();

        Board savedBoard = boardRepository.save(board);
        return BoardDto.Response.from(savedBoard);
    }

    // 게시판 목록 조회 (활성화된 것만)
    public List<BoardDto.Response> getAllBoards() {
        return boardRepository.findAll().stream()
                .filter(board -> board.getIsActive() != null && board.getIsActive())
                .map(BoardDto.Response::from)
                .collect(Collectors.toList());
    }

    // 게시판 상세 조회
    public BoardDto.Response getBoard(Long boardId) {
        Board board = boardRepository.findById(boardId)
                .orElseThrow(() -> new IllegalArgumentException("게시판을 찾을 수 없습니다."));
        return BoardDto.Response.from(board);
    }

    // ========== 관리자 기능 ==========

    // 모든 게시판 조회 (관리자용, 타입별 통계 포함)
    public List<BoardDto.AdminResponse> getAllBoardsForAdmin() {
        return boardRepository.findAll().stream()
                .map(board -> {
                    BoardDto.AdminResponse response = BoardDto.AdminResponse.from(board);
                    // 타입별 게시글 수 계산
                    response.setGeneralCount(postRepository.countByBoardIdAndPostTypeAndIsDeletedFalse(board.getId(), PostType.GENERAL));
                    response.setQuestionCount(postRepository.countByBoardIdAndPostTypeAndIsDeletedFalse(board.getId(), PostType.QUESTION));
                    response.setImageCount(postRepository.countByBoardIdAndPostTypeAndIsDeletedFalse(board.getId(), PostType.IMAGE));
                    response.setVideoCount(postRepository.countByBoardIdAndPostTypeAndIsDeletedFalse(board.getId(), PostType.VIDEO));
                    return response;
                })
                .collect(Collectors.toList());
    }

    // 게시판 수정
    @Transactional
    public BoardDto.AdminResponse updateBoard(Long boardId, BoardDto.UpdateRequest request) {
        Board board = boardRepository.findById(boardId)
                .orElseThrow(() -> new IllegalArgumentException("게시판을 찾을 수 없습니다."));

        if (request.getName() != null && !request.getName().equals(board.getName())) {
            if (boardRepository.existsByName(request.getName())) {
                throw new IllegalArgumentException("이미 존재하는 게시판 이름입니다.");
            }
            board.setName(request.getName());
        }

        if (request.getDescription() != null) {
            board.setDescription(request.getDescription());
        }

        if (request.getCategory() != null) {
            board.setCategory(Board.BoardCategory.valueOf(request.getCategory()));
        }

        if (request.getIsActive() != null) {
            board.setIsActive(request.getIsActive());
        }

        if (request.getOrderIndex() != null) {
            board.setOrderIndex(request.getOrderIndex());
        }

        return BoardDto.AdminResponse.from(board);
    }

    // 게시판 삭제
    @Transactional
    public void deleteBoard(Long boardId) {
        Board board = boardRepository.findById(boardId)
                .orElseThrow(() -> new IllegalArgumentException("게시판을 찾을 수 없습니다."));

        // 게시글이 있는 경우 삭제 불가
        if (board.getPostCount() != null && board.getPostCount() > 0) {
            throw new IllegalArgumentException("게시글이 있는 게시판은 삭제할 수 없습니다. 먼저 게시글을 모두 삭제하거나 비활성화하세요.");
        }

        boardRepository.delete(board);
    }

    // 게시판 활성화/비활성화 토글
    @Transactional
    public BoardDto.AdminResponse toggleBoardStatus(Long boardId) {
        Board board = boardRepository.findById(boardId)
                .orElseThrow(() -> new IllegalArgumentException("게시판을 찾을 수 없습니다."));

        board.setIsActive(!board.getIsActive());
        return BoardDto.AdminResponse.from(board);
    }
}
