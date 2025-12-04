package com.community.controller;

import com.community.dto.BoardDto;
import com.community.service.BoardService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/admin/boards")
@RequiredArgsConstructor
@PreAuthorize("hasRole('DEVELOPER')")
public class AdminBoardController {

    private final BoardService boardService;

    /**
     * 모든 게시판 조회 (관리자용)
     */
    @GetMapping
    public ResponseEntity<List<BoardDto.AdminResponse>> getAllBoards() {
        List<BoardDto.AdminResponse> boards = boardService.getAllBoardsForAdmin();
        return ResponseEntity.ok(boards);
    }

    /**
     * 게시판 생성
     */
    @PostMapping
    public ResponseEntity<?> createBoard(@RequestBody BoardDto.CreateRequest request) {
        try {
            BoardDto.Response response = boardService.createBoard(request);
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    /**
     * 게시판 수정
     */
    @PutMapping("/{boardId}")
    public ResponseEntity<?> updateBoard(
            @PathVariable Long boardId,
            @RequestBody BoardDto.UpdateRequest request
    ) {
        try {
            BoardDto.AdminResponse response = boardService.updateBoard(boardId, request);
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    /**
     * 게시판 삭제
     */
    @DeleteMapping("/{boardId}")
    public ResponseEntity<?> deleteBoard(@PathVariable Long boardId) {
        try {
            boardService.deleteBoard(boardId);
            return ResponseEntity.ok().build();
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    /**
     * 게시판 활성화/비활성화 토글
     */
    @PostMapping("/{boardId}/toggle")
    public ResponseEntity<?> toggleBoardStatus(@PathVariable Long boardId) {
        try {
            BoardDto.AdminResponse response = boardService.toggleBoardStatus(boardId);
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }
}
