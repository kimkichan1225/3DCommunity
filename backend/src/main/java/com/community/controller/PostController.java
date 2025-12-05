package com.community.controller;

import com.community.dto.PostDto;
import com.community.model.PostType;
import com.community.model.User;
import com.community.service.PostService;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;
import com.community.repository.UserRepository;

@RestController
@RequestMapping("/api/posts")
@RequiredArgsConstructor
public class PostController {

    private final PostService postService;
    private final UserRepository userRepository;

    // 게시글 생성
    @PostMapping
    public ResponseEntity<?> createPost(
            @RequestBody PostDto.CreateRequest request,
            @AuthenticationPrincipal UserDetails userDetails) {
        try {
            User user = userRepository.findByEmail(userDetails.getUsername())
                    .orElseThrow(() -> new IllegalArgumentException("사용자를 찾을 수 없습니다."));
            PostDto.Response response = postService.createPost(request, user.getId());
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    // 게시글 상세 조회
    @GetMapping("/{postId}")
    public ResponseEntity<?> getPost(@PathVariable Long postId) {
        try {
            PostDto.Response response = postService.getPost(postId);
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    // 게시판별 게시글 목록 (타입 필터링 옵션)
    @GetMapping("/board/{boardId}")
    public ResponseEntity<?> getPostsByBoard(
            @PathVariable Long boardId,
            @RequestParam(required = false) PostType postType,  // 타입 필터: GENERAL, QUESTION, IMAGE, VIDEO (null이면 전체)
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size) {
        try {
            Pageable pageable = PageRequest.of(page, size);
            Page<PostDto.ListResponse> response = postService.getPostsByBoard(boardId, postType, pageable);
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    // 게시글 수정
    @PutMapping("/{postId}")
    public ResponseEntity<?> updatePost(
            @PathVariable Long postId,
            @RequestBody PostDto.UpdateRequest request,
            @AuthenticationPrincipal UserDetails userDetails) {
        try {
            User user = userRepository.findByEmail(userDetails.getUsername())
                    .orElseThrow(() -> new IllegalArgumentException("사용자를 찾을 수 없습니다."));
            PostDto.Response response = postService.updatePost(postId, request, user.getId());
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    // 게시글 삭제
    @DeleteMapping("/{postId}")
    public ResponseEntity<?> deletePost(
            @PathVariable Long postId,
            @AuthenticationPrincipal UserDetails userDetails) {
        try {
            User user = userRepository.findByEmail(userDetails.getUsername())
                    .orElseThrow(() -> new IllegalArgumentException("사용자를 찾을 수 없습니다."));
            postService.deletePost(postId, user.getId());
            return ResponseEntity.ok("게시글이 삭제되었습니다.");
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    // 게시글 검색 (제목 또는 내용)
    @GetMapping("/board/{boardId}/search")
    public ResponseEntity<?> searchPosts(
            @PathVariable Long boardId,
            @RequestParam String keyword,
            @RequestParam(defaultValue = "title") String searchType, // title, content, all
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size) {
        try {
            Pageable pageable = PageRequest.of(page, size);
            Page<PostDto.ListResponse> response = postService.searchPosts(boardId, keyword, searchType, pageable);
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }
}
