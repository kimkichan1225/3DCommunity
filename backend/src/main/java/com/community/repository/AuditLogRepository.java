package com.community.repository;

import com.community.model.AuditLog;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;

@Repository
public interface AuditLogRepository extends JpaRepository<AuditLog, Long> {

    // 관리자별 활동 로그 조회
    Page<AuditLog> findByAdminId(Long adminId, Pageable pageable);

    // 작업 유형별 로그 조회
    Page<AuditLog> findByAction(String action, Pageable pageable);

    // 특정 대상에 대한 로그 조회
    List<AuditLog> findByTargetTypeAndTargetId(String targetType, Long targetId);

    // 기간별 로그 조회
    Page<AuditLog> findByCreatedAtBetween(LocalDateTime start, LocalDateTime end, Pageable pageable);

    // 최근 로그 조회
    List<AuditLog> findTop100ByOrderByCreatedAtDesc();
}
