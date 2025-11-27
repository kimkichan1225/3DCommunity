package com.community.controller;

import com.community.dto.AuditLogDto;
import com.community.dto.DashboardStatsDto;
import com.community.model.User;
import com.community.service.AdminService;
import com.community.service.AuditLogService;
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
@RequestMapping("/api/admin")
@RequiredArgsConstructor
@PreAuthorize("hasRole('DEVELOPER')")
public class AdminController {

    private final AdminService adminService;
    private final AuditLogService auditLogService;

    /**
     * 대시보드 통계 조회
     */
    @GetMapping("/dashboard/stats")
    public ResponseEntity<DashboardStatsDto> getDashboardStats() {
        DashboardStatsDto stats = adminService.getDashboardStats();
        return ResponseEntity.ok(stats);
    }

    /**
     * 관리자 활동 로그 조회
     */
    @GetMapping("/audit-logs")
    public ResponseEntity<Page<AuditLogDto>> getAuditLogs(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "50") int size,
            @RequestParam(required = false) String action,
            @RequestParam(required = false) Long adminId
    ) {
        Pageable pageable = PageRequest.of(page, size, Sort.by("createdAt").descending());

        Page<AuditLogDto> logs;

        if (action != null) {
            logs = auditLogService.getLogsByAction(action, pageable).map(AuditLogDto::fromEntity);
        } else if (adminId != null) {
            logs = auditLogService.getLogsByAdmin(adminId, pageable).map(AuditLogDto::fromEntity);
        } else {
            logs = auditLogService.getAllLogs(pageable).map(AuditLogDto::fromEntity);
        }

        return ResponseEntity.ok(logs);
    }

    /**
     * 관리자 권한 확인 엔드포인트
     */
    @GetMapping("/check")
    public ResponseEntity<String> checkAdminAccess(@AuthenticationPrincipal User user) {
        return ResponseEntity.ok("Admin access granted for user: " + user.getUsername());
    }
}
