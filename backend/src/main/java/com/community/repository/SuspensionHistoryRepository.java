package com.community.repository;

import com.community.model.SuspensionHistory;
import com.community.model.User;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface SuspensionHistoryRepository extends JpaRepository<SuspensionHistory, Long> {

    /**
     * 특정 사용자의 제재 이력 조회 (최신순)
     */
    Page<SuspensionHistory> findByUserOrderByCreatedAtDesc(User user, Pageable pageable);

    /**
     * 특정 사용자의 제재 이력 개수
     */
    long countByUser(User user);
}
