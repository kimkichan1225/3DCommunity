package com.community.service;

import com.community.model.AuditLog;
import com.community.model.User;
import com.community.repository.AuditLogRepository;
import jakarta.servlet.http.HttpServletRequest;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;

@Service
@RequiredArgsConstructor
public class AuditLogService {

    private final AuditLogRepository auditLogRepository;

    /**
     * 관리자 활동 로그 기록
     */
    @Transactional
    public void log(User admin, String action, String targetType, Long targetId, String description, HttpServletRequest request) {
        AuditLog log = AuditLog.builder()
                .admin(admin)
                .action(action)
                .targetType(targetType)
                .targetId(targetId)
                .description(description)
                .ipAddress(getClientIP(request))
                .build();

        auditLogRepository.save(log);
    }

    /**
     * 모든 로그 조회 (페이징)
     */
    public Page<AuditLog> getAllLogs(Pageable pageable) {
        return auditLogRepository.findAll(pageable);
    }

    /**
     * 관리자별 로그 조회
     */
    public Page<AuditLog> getLogsByAdmin(Long adminId, Pageable pageable) {
        return auditLogRepository.findByAdminId(adminId, pageable);
    }

    /**
     * 작업 유형별 로그 조회
     */
    public Page<AuditLog> getLogsByAction(String action, Pageable pageable) {
        return auditLogRepository.findByAction(action, pageable);
    }

    /**
     * 기간별 로그 조회
     */
    public Page<AuditLog> getLogsByDateRange(LocalDateTime start, LocalDateTime end, Pageable pageable) {
        return auditLogRepository.findByCreatedAtBetween(start, end, pageable);
    }

    /**
     * 클라이언트 IP 주소 추출
     */
    private String getClientIP(HttpServletRequest request) {
        String ip = request.getHeader("X-Forwarded-For");
        if (ip == null || ip.isEmpty() || "unknown".equalsIgnoreCase(ip)) {
            ip = request.getHeader("Proxy-Client-IP");
        }
        if (ip == null || ip.isEmpty() || "unknown".equalsIgnoreCase(ip)) {
            ip = request.getHeader("WL-Proxy-Client-IP");
        }
        if (ip == null || ip.isEmpty() || "unknown".equalsIgnoreCase(ip)) {
            ip = request.getRemoteAddr();
        }
        return ip;
    }
}
