package com.community.service;

import com.community.dto.ReportDto;
import com.community.model.*;
import com.community.repository.*;
import jakarta.servlet.http.HttpServletRequest;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;

@Service
@RequiredArgsConstructor
public class ReportService {

    private final ReportRepository reportRepository;
    private final UserRepository userRepository;
    private final PostRepository postRepository;
    private final CommentRepository commentRepository;
    private final AuditLogService auditLogService;

    /**
     * 신고 생성
     */
    @Transactional
    public ReportDto.Response createReport(ReportDto.CreateRequest request, User reporter) {
        // 중복 신고 확인
        boolean alreadyReported = reportRepository.existsByReporterIdAndReportTypeAndTargetId(
                reporter.getId(),
                request.getReportType(),
                request.getTargetId()
        );

        if (alreadyReported) {
            throw new RuntimeException("이미 신고한 내용입니다.");
        }

        // 신고 대상 정보 조회
        String targetTitle = "";
        User targetUser = null;

        switch (request.getReportType()) {
            case POST:
                Post post = postRepository.findById(request.getTargetId())
                        .orElseThrow(() -> new RuntimeException("게시글을 찾을 수 없습니다."));
                targetTitle = post.getTitle();
                targetUser = post.getAuthor();
                break;

            case COMMENT:
                Comment comment = commentRepository.findById(request.getTargetId())
                        .orElseThrow(() -> new RuntimeException("댓글을 찾을 수 없습니다."));
                targetTitle = comment.getContent().length() > 100
                    ? comment.getContent().substring(0, 100) + "..."
                    : comment.getContent();
                targetUser = comment.getAuthor();
                break;

            case USER:
                targetUser = userRepository.findById(request.getTargetId())
                        .orElseThrow(() -> new RuntimeException("사용자를 찾을 수 없습니다."));
                targetTitle = targetUser.getNickname();
                break;
        }

        Report report = Report.builder()
                .reportType(request.getReportType())
                .targetId(request.getTargetId())
                .targetTitle(targetTitle)
                .reporter(reporter)
                .targetUser(targetUser)
                .reason(request.getReason())
                .description(request.getDescription())
                .status(Report.ReportStatus.PENDING)
                .build();

        Report savedReport = reportRepository.save(report);
        return ReportDto.Response.fromEntity(savedReport);
    }

    /**
     * 신고 목록 조회 (관리자용)
     */
    public Page<ReportDto.ListResponse> getReports(
            Report.ReportStatus status,
            Report.ReportType reportType,
            Pageable pageable
    ) {
        Page<Report> reports = reportRepository.searchReports(status, reportType, pageable);
        return reports.map(ReportDto.ListResponse::fromEntity);
    }

    /**
     * 신고 상세 조회
     */
    public ReportDto.Response getReport(Long reportId) {
        Report report = reportRepository.findById(reportId)
                .orElseThrow(() -> new RuntimeException("신고를 찾을 수 없습니다."));
        return ReportDto.Response.fromEntity(report);
    }

    /**
     * 신고 처리 (관리자용)
     */
    @Transactional
    public ReportDto.Response processReport(
            Long reportId,
            ReportDto.ProcessRequest request,
            User admin,
            HttpServletRequest httpRequest
    ) {
        Report report = reportRepository.findById(reportId)
                .orElseThrow(() -> new RuntimeException("신고를 찾을 수 없습니다."));

        if (report.getStatus() != Report.ReportStatus.PENDING) {
            throw new RuntimeException("이미 처리된 신고입니다.");
        }

        report.setStatus(request.getStatus());
        report.setAdminNote(request.getAdminNote());
        report.setAdmin(admin);
        report.setProcessedAt(LocalDateTime.now());

        Report savedReport = reportRepository.save(report);

        // 감사 로그 기록
        String description = String.format("신고 처리: [%s] %s -> %s (사유: %s)",
                report.getReportType().getDescription(),
                report.getTargetTitle(),
                request.getStatus().getDescription(),
                request.getAdminNote());
        auditLogService.log(admin, "REPORT_PROCESS", "Report", reportId, description, httpRequest);

        return ReportDto.Response.fromEntity(savedReport);
    }

    /**
     * 대기 중인 신고 개수 조회
     */
    public long getPendingReportCount() {
        return reportRepository.countByStatus(Report.ReportStatus.PENDING);
    }

    /**
     * 특정 대상에 대한 신고 개수 조회
     */
    public long getReportCount(Report.ReportType reportType, Long targetId) {
        return reportRepository.countByReportTypeAndTargetId(reportType, targetId);
    }
}
