package com.community.controller;

import com.community.dto.ReportDto;
import com.community.model.Report;
import com.community.model.User;
import com.community.service.ReportService;
import jakarta.servlet.http.HttpServletRequest;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/reports")
@RequiredArgsConstructor
public class ReportController {

    private final ReportService reportService;

    /**
     * 신고 생성 (일반 사용자)
     */
    @PostMapping
    @PreAuthorize("hasAnyRole('USER', 'ADMIN', 'DEVELOPER')")
    public ResponseEntity<?> createReport(
            @RequestBody ReportDto.CreateRequest request,
            @AuthenticationPrincipal User user
    ) {
        try {
            ReportDto.Response response = reportService.createReport(request, user);
            return ResponseEntity.ok(response);
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    /**
     * 신고 목록 조회 (관리자용)
     */
    @GetMapping("/admin")
    @PreAuthorize("hasAnyRole('ADMIN', 'DEVELOPER')")
    public ResponseEntity<Page<ReportDto.ListResponse>> getReports(
            @RequestParam(required = false) Report.ReportStatus status,
            @RequestParam(required = false) Report.ReportType reportType,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size,
            @RequestParam(defaultValue = "createdAt") String sortBy,
            @RequestParam(defaultValue = "DESC") String sortDirection
    ) {
        Sort.Direction direction = sortDirection.equalsIgnoreCase("ASC")
                ? Sort.Direction.ASC
                : Sort.Direction.DESC;
        Pageable pageable = PageRequest.of(page, size, Sort.by(direction, sortBy));

        Page<ReportDto.ListResponse> reports = reportService.getReports(status, reportType, pageable);
        return ResponseEntity.ok(reports);
    }

    /**
     * 신고 상세 조회 (관리자용)
     */
    @GetMapping("/admin/{reportId}")
    @PreAuthorize("hasAnyRole('ADMIN', 'DEVELOPER')")
    public ResponseEntity<?> getReport(@PathVariable Long reportId) {
        try {
            ReportDto.Response response = reportService.getReport(reportId);
            return ResponseEntity.ok(response);
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    /**
     * 신고 처리 (관리자용)
     */
    @PostMapping("/admin/{reportId}/process")
    @PreAuthorize("hasAnyRole('ADMIN', 'DEVELOPER')")
    public ResponseEntity<?> processReport(
            @PathVariable Long reportId,
            @RequestBody ReportDto.ProcessRequest request,
            @AuthenticationPrincipal User admin,
            HttpServletRequest httpRequest
    ) {
        try {
            ReportDto.Response response = reportService.processReport(reportId, request, admin, httpRequest);
            return ResponseEntity.ok(response);
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    /**
     * 대기 중인 신고 개수 조회 (관리자용)
     */
    @GetMapping("/admin/pending-count")
    @PreAuthorize("hasAnyRole('ADMIN', 'DEVELOPER')")
    public ResponseEntity<Long> getPendingReportCount() {
        long count = reportService.getPendingReportCount();
        return ResponseEntity.ok(count);
    }

    /**
     * 특정 대상에 대한 신고 개수 조회
     */
    @GetMapping("/count")
    public ResponseEntity<Long> getReportCount(
            @RequestParam Report.ReportType reportType,
            @RequestParam Long targetId
    ) {
        long count = reportService.getReportCount(reportType, targetId);
        return ResponseEntity.ok(count);
    }
}
