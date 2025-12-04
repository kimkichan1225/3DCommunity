package com.community.controller;

import com.community.dto.*;
import com.community.model.Role;
import com.community.model.SuspensionHistory;
import com.community.model.User;
import com.community.service.AdminService;
import com.community.service.AuditLogService;
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
@RequestMapping("/api/admin")
@RequiredArgsConstructor
public class AdminController {

    private final AdminService adminService;
    private final AuditLogService auditLogService;

    /**
     * 대시보드 통계 조회
     */
    @GetMapping("/dashboard/stats")
    @PreAuthorize("hasAnyRole('ADMIN', 'DEVELOPER')")
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
    @PreAuthorize("hasAnyRole('ADMIN', 'DEVELOPER')")
    public ResponseEntity<String> checkAdminAccess(@AuthenticationPrincipal User user) {
        return ResponseEntity.ok("Admin access granted for user: " + user.getUsername());
    }

    // ==================== 사용자 관리 API ====================

    /**
     * 사용자 목록 조회 (검색, 필터, 페이지네이션)
     */
    @GetMapping("/users")
    @PreAuthorize("hasAnyRole('ADMIN', 'DEVELOPER')")
    public ResponseEntity<Page<UserManagementDto>> getUsers(
            @RequestParam(required = false) String search,
            @RequestParam(required = false) String role,
            @RequestParam(required = false) Boolean isSuspended,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size,
            @RequestParam(defaultValue = "createdAt") String sortBy,
            @RequestParam(defaultValue = "DESC") String sortDirection
    ) {
        Sort.Direction direction = sortDirection.equalsIgnoreCase("ASC") ? Sort.Direction.ASC : Sort.Direction.DESC;
        Pageable pageable = PageRequest.of(page, size, Sort.by(direction, sortBy));

        Role roleEnum = null;
        if (role != null && !role.isEmpty()) {
            try {
                roleEnum = Role.valueOf(role);
            } catch (IllegalArgumentException e) {
                return ResponseEntity.badRequest().build();
            }
        }

        Page<User> users = adminService.searchUsers(search, roleEnum, isSuspended, pageable);
        Page<UserManagementDto> userDtos = users.map(UserManagementDto::fromEntity);

        return ResponseEntity.ok(userDtos);
    }

    /**
     * 사용자 상세 조회
     */
    @GetMapping("/users/{userId}")
    @PreAuthorize("hasAnyRole('ADMIN', 'DEVELOPER')")
    public ResponseEntity<UserManagementDto> getUserDetail(@PathVariable Long userId) {
        User user = adminService.searchUsers(null, null, null, PageRequest.of(0, 1))
                .stream()
                .filter(u -> u.getId().equals(userId))
                .findFirst()
                .orElseThrow(() -> new RuntimeException("사용자를 찾을 수 없습니다."));

        return ResponseEntity.ok(UserManagementDto.fromEntity(user));
    }

    /**
     * 사용자 제재
     */
    @PostMapping("/users/{userId}/suspend")
    @PreAuthorize("hasAnyRole('ADMIN', 'DEVELOPER')")
    public ResponseEntity<UserManagementDto> suspendUser(
            @PathVariable Long userId,
            @RequestBody SuspensionRequest request,
            @AuthenticationPrincipal User admin,
            HttpServletRequest httpRequest
    ) {
        try {
            User user = adminService.suspendUser(userId, request, admin, httpRequest);
            return ResponseEntity.ok(UserManagementDto.fromEntity(user));
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().build();
        }
    }

    /**
     * 역할 변경
     */
    @PostMapping("/users/{userId}/role")
    @PreAuthorize("hasRole('DEVELOPER')")  // DEVELOPER만 역할 변경 가능
    public ResponseEntity<UserManagementDto> changeUserRole(
            @PathVariable Long userId,
            @RequestBody RoleChangeRequest request,
            @AuthenticationPrincipal User admin,
            HttpServletRequest httpRequest
    ) {
        try {
            User user = adminService.changeUserRole(userId, request, admin, httpRequest);
            return ResponseEntity.ok(UserManagementDto.fromEntity(user));
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().build();
        }
    }

    /**
     * 사용자 제재 이력 조회
     */
    @GetMapping("/users/{userId}/suspension-history")
    @PreAuthorize("hasAnyRole('ADMIN', 'DEVELOPER')")
    public ResponseEntity<Page<SuspensionHistoryDto>> getUserSuspensionHistory(
            @PathVariable Long userId,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size
    ) {
        Pageable pageable = PageRequest.of(page, size);
        Page<SuspensionHistory> history = adminService.getUserSuspensionHistory(userId, pageable);
        Page<SuspensionHistoryDto> historyDtos = history.map(SuspensionHistoryDto::fromEntity);

        return ResponseEntity.ok(historyDtos);
    }
}
