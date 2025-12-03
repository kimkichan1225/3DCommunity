package com.community.repository;

import com.community.model.Notice;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface NoticeRepository extends JpaRepository<Notice, Long> {

    // 삭제되지 않은 공지사항 목록 (고정된 것 우선, 우선순위 높은 것 우선, 최신순)
    Page<Notice> findByIsDeletedFalseOrderByIsPinnedDescPriorityDescCreatedAtDesc(Pageable pageable);

    // 고정된 공지사항 목록
    List<Notice> findByIsPinnedTrueAndIsDeletedFalseOrderByPriorityDescCreatedAtDesc();

    // 제목 검색
    Page<Notice> findByTitleContainingAndIsDeletedFalseOrderByIsPinnedDescPriorityDescCreatedAtDesc(
            String keyword, Pageable pageable);
}
