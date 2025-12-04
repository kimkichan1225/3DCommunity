package com.community.repository;

import com.community.model.Report;
import com.community.model.Report.ReportStatus;
import com.community.model.Report.ReportType;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface ReportRepository extends JpaRepository<Report, Long> {

    // 상태별 신고 조회
    Page<Report> findByStatus(ReportStatus status, Pageable pageable);

    // 신고 유형별 조회
    Page<Report> findByReportType(ReportType reportType, Pageable pageable);

    // 신고자별 조회
    Page<Report> findByReporter_Id(Long reporterId, Pageable pageable);

    // 신고 대상 사용자별 조회
    Page<Report> findByTargetUser_Id(Long targetUserId, Pageable pageable);

    // 복합 검색 (상태 + 타입)
    @Query("SELECT r FROM Report r WHERE " +
           "(:status IS NULL OR r.status = :status) AND " +
           "(:reportType IS NULL OR r.reportType = :reportType) " +
           "ORDER BY r.createdAt DESC")
    Page<Report> searchReports(
        @Param("status") ReportStatus status,
        @Param("reportType") ReportType reportType,
        Pageable pageable
    );

    // 특정 대상에 대한 신고 개수 조회
    long countByReportTypeAndTargetId(ReportType reportType, Long targetId);

    // 대기 중인 신고 개수
    long countByStatus(ReportStatus status);

    // 특정 사용자가 이미 신고했는지 확인
    boolean existsByReporterIdAndReportTypeAndTargetId(
        Long reporterId,
        ReportType reportType,
        Long targetId
    );
}
