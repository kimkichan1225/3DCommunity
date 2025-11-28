package com.community.controller;

import com.community.dto.CommentDto;
import com.community.model.User;
import com.community.repository.UserRepository;
import com.community.service.CommentService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/comments")
@RequiredArgsConstructor
public class CommentController {

    private final CommentService commentService;
    private final UserRepository userRepository;

    // 댓글 작성
    @PostMapping
    public ResponseEntity<?> createComment(
            @RequestBody CommentDto.CreateRequest request,
            @AuthenticationPrincipal UserDetails userDetails) {
        try {
            User user = userRepository.findByEmail(userDetails.getUsername())
                    .orElseThrow(() -> new IllegalArgumentException("사용자를 찾을 수 없습니다."));
            CommentDto.Response response = commentService.createComment(request, user.getId());
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    // 게시글의 댓글 목록 조회
    @GetMapping("/post/{postId}")
    public ResponseEntity<?> getCommentsByPost(@PathVariable Long postId) {
        try {
            List<CommentDto.Response> response = commentService.getCommentsByPost(postId);
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    // 댓글 상세 조회
    @GetMapping("/{commentId}")
    public ResponseEntity<?> getComment(@PathVariable Long commentId) {
        try {
            CommentDto.Response response = commentService.getComment(commentId);
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    // 댓글 수정
    @PutMapping("/{commentId}")
    public ResponseEntity<?> updateComment(
            @PathVariable Long commentId,
            @RequestBody CommentDto.UpdateRequest request,
            @AuthenticationPrincipal UserDetails userDetails) {
        try {
            User user = userRepository.findByEmail(userDetails.getUsername())
                    .orElseThrow(() -> new IllegalArgumentException("사용자를 찾을 수 없습니다."));
            CommentDto.Response response = commentService.updateComment(commentId, request, user.getId());
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    // 댓글 삭제
    @DeleteMapping("/{commentId}")
    public ResponseEntity<?> deleteComment(
            @PathVariable Long commentId,
            @AuthenticationPrincipal UserDetails userDetails) {
        try {
            User user = userRepository.findByEmail(userDetails.getUsername())
                    .orElseThrow(() -> new IllegalArgumentException("사용자를 찾을 수 없습니다."));
            commentService.deleteComment(commentId, user.getId());
            return ResponseEntity.ok("댓글이 삭제되었습니다.");
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    // 게시글의 댓글 수 조회
    @GetMapping("/post/{postId}/count")
    public ResponseEntity<?> getCommentCount(@PathVariable Long postId) {
        try {
            Long count = commentService.getCommentCount(postId);
            return ResponseEntity.ok(count);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }
}
