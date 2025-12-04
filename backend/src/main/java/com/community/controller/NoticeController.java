package com.community.controller;

import com.community.dto.NoticeDto;
import com.community.model.User;
import com.community.service.NoticeService;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequiredArgsConstructor
public class NoticeController {

    private final NoticeService noticeService;

    /**
     * 공지사항 목록 조회 (모든 사용자)
     */
    @GetMapping("/api/notices")
    public ResponseEntity<Page<NoticeDto.ListResponse>> getNotices(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size
    ) {
        Pageable pageable = PageRequest.of(page, size);
        Page<NoticeDto.ListResponse> notices = noticeService.getNotices(pageable);
        return ResponseEntity.ok(notices);
    }

    /**
     * 공지사항 상세 조회 (모든 사용자)
     */
    @GetMapping("/api/notices/{id}")
    public ResponseEntity<NoticeDto.Response> getNotice(@PathVariable Long id) {
        NoticeDto.Response notice = noticeService.getNotice(id);
        return ResponseEntity.ok(notice);
    }

    /**
     * 고정된 공지사항 목록 조회 (모든 사용자)
     */
    @GetMapping("/api/notices/pinned")
    public ResponseEntity<List<NoticeDto.ListResponse>> getPinnedNotices() {
        List<NoticeDto.ListResponse> notices = noticeService.getPinnedNotices();
        return ResponseEntity.ok(notices);
    }

    /**
     * 공지사항 검색 (모든 사용자)
     */
    @GetMapping("/api/notices/search")
    public ResponseEntity<Page<NoticeDto.ListResponse>> searchNotices(
            @RequestParam String keyword,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size
    ) {
        Pageable pageable = PageRequest.of(page, size);
        Page<NoticeDto.ListResponse> notices = noticeService.searchNotices(keyword, pageable);
        return ResponseEntity.ok(notices);
    }

    /**
     * 공지사항 생성 (관리자만)
     */
    @PostMapping("/api/admin/notices")
    @PreAuthorize("hasRole('DEVELOPER')")
    public ResponseEntity<NoticeDto.Response> createNotice(
            @RequestBody NoticeDto.CreateRequest request,
            @AuthenticationPrincipal User user
    ) {
        NoticeDto.Response notice = noticeService.createNotice(request, user.getId());
        return ResponseEntity.ok(notice);
    }

    /**
     * 공지사항 수정 (관리자만)
     */
    @PutMapping("/api/admin/notices/{id}")
    @PreAuthorize("hasRole('DEVELOPER')")
    public ResponseEntity<NoticeDto.Response> updateNotice(
            @PathVariable Long id,
            @RequestBody NoticeDto.UpdateRequest request,
            @AuthenticationPrincipal User user
    ) {
        NoticeDto.Response notice = noticeService.updateNotice(id, request, user.getId());
        return ResponseEntity.ok(notice);
    }

    /**
     * 공지사항 삭제 (관리자만)
     */
    @DeleteMapping("/api/admin/notices/{id}")
    @PreAuthorize("hasRole('DEVELOPER')")
    public ResponseEntity<Void> deleteNotice(
            @PathVariable Long id,
            @AuthenticationPrincipal User user
    ) {
        noticeService.deleteNotice(id, user.getId());
        return ResponseEntity.ok().build();
    }
}
