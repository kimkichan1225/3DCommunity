package com.community.service;

import com.community.dto.NoticeDto;
import com.community.model.Notice;
import com.community.model.User;
import com.community.repository.NoticeRepository;
import com.community.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class NoticeService {

    private final NoticeRepository noticeRepository;
    private final UserRepository userRepository;

    /**
     * 공지사항 생성 (관리자만 가능)
     */
    @Transactional
    public NoticeDto.Response createNotice(NoticeDto.CreateRequest request, Long userId) {
        User author = userRepository.findById(userId)
                .orElseThrow(() -> new IllegalArgumentException("사용자를 찾을 수 없습니다."));

        Notice notice = Notice.builder()
                .author(author)
                .title(request.getTitle())
                .content(request.getContent())
                .isPinned(request.getIsPinned() != null ? request.getIsPinned() : false)
                .priority(request.getPriority() != null ? request.getPriority() : 0)
                .build();

        Notice savedNotice = noticeRepository.save(notice);
        return NoticeDto.Response.from(savedNotice);
    }

    /**
     * 공지사항 상세 조회
     */
    @Transactional
    public NoticeDto.Response getNotice(Long noticeId) {
        Notice notice = noticeRepository.findById(noticeId)
                .orElseThrow(() -> new IllegalArgumentException("공지사항을 찾을 수 없습니다."));

        if (notice.getIsDeleted()) {
            throw new IllegalArgumentException("삭제된 공지사항입니다.");
        }

        // 조회수 증가
        notice.setViewCount(notice.getViewCount() + 1);
        return NoticeDto.Response.from(notice);
    }

    /**
     * 공지사항 목록 조회 (페이징)
     */
    public Page<NoticeDto.ListResponse> getNotices(Pageable pageable) {
        return noticeRepository.findByIsDeletedFalseOrderByIsPinnedDescPriorityDescCreatedAtDesc(pageable)
                .map(NoticeDto.ListResponse::from);
    }

    /**
     * 고정된 공지사항 목록 조회
     */
    public List<NoticeDto.ListResponse> getPinnedNotices() {
        return noticeRepository.findByIsPinnedTrueAndIsDeletedFalseOrderByPriorityDescCreatedAtDesc()
                .stream()
                .map(NoticeDto.ListResponse::from)
                .collect(Collectors.toList());
    }

    /**
     * 공지사항 수정 (관리자만 가능)
     */
    @Transactional
    public NoticeDto.Response updateNotice(Long noticeId, NoticeDto.UpdateRequest request, Long userId) {
        Notice notice = noticeRepository.findById(noticeId)
                .orElseThrow(() -> new IllegalArgumentException("공지사항을 찾을 수 없습니다."));

        // 수정
        notice.setTitle(request.getTitle());
        notice.setContent(request.getContent());
        if (request.getIsPinned() != null) {
            notice.setIsPinned(request.getIsPinned());
        }
        if (request.getPriority() != null) {
            notice.setPriority(request.getPriority());
        }

        return NoticeDto.Response.from(notice);
    }

    /**
     * 공지사항 삭제 (소프트 삭제, 관리자만 가능)
     */
    @Transactional
    public void deleteNotice(Long noticeId, Long userId) {
        Notice notice = noticeRepository.findById(noticeId)
                .orElseThrow(() -> new IllegalArgumentException("공지사항을 찾을 수 없습니다."));

        notice.setIsDeleted(true);
    }

    /**
     * 공지사항 검색
     */
    public Page<NoticeDto.ListResponse> searchNotices(String keyword, Pageable pageable) {
        return noticeRepository.findByTitleContainingAndIsDeletedFalseOrderByIsPinnedDescPriorityDescCreatedAtDesc(
                keyword, pageable)
                .map(NoticeDto.ListResponse::from);
    }
}
