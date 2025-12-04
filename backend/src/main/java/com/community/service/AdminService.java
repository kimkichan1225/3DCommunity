package com.community.service;

import com.community.dto.DashboardStatsDto;
import com.community.dto.RoleChangeRequest;
import com.community.dto.SuspensionRequest;
import com.community.model.*;
import com.community.repository.PostRepository;
import com.community.repository.SuspensionHistoryRepository;
import com.community.repository.UserRepository;
import jakarta.servlet.http.HttpServletRequest;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.LocalDateTime;

@Service
@RequiredArgsConstructor
public class AdminService {

    private final UserRepository userRepository;
    private final PostRepository postRepository;
    private final SuspensionHistoryRepository suspensionHistoryRepository;
    private final AuditLogService auditLogService;

    /**
     * 대시보드 통계 데이터 조회 (타입별 통계 포함)
     */
    public DashboardStatsDto getDashboardStats() {
        long totalUsers = userRepository.count();

        // 오늘 가입한 사용자 (00:00:00 ~ 23:59:59)
        LocalDateTime todayStart = LocalDate.now().atStartOfDay();
        LocalDateTime todayEnd = todayStart.plusDays(1);

        // TODO: 실제 구현 시 커스텀 쿼리 필요
        long todayNewUsers = 0; // userRepository.countByCreatedAtBetween(todayStart, todayEnd);

        long totalPosts = postRepository.count();

        // TODO: Comment Repository에서 조회
        long totalComments = 0;

        // 타입별 게시글 수 계산 (모든 게시판 전체)
        long generalPosts = postRepository.findAll().stream()
                .filter(post -> !post.getIsDeleted() && post.getPostType() == PostType.GENERAL)
                .count();
        long questionPosts = postRepository.findAll().stream()
                .filter(post -> !post.getIsDeleted() && post.getPostType() == PostType.QUESTION)
                .count();
        long imagePosts = postRepository.findAll().stream()
                .filter(post -> !post.getIsDeleted() && post.getPostType() == PostType.IMAGE)
                .count();
        long videoPosts = postRepository.findAll().stream()
                .filter(post -> !post.getIsDeleted() && post.getPostType() == PostType.VIDEO)
                .count();

        return DashboardStatsDto.builder()
                .totalUsers(totalUsers)
                .todayNewUsers(todayNewUsers)
                .totalPosts(totalPosts)
                .totalComments(totalComments)
                .generalPosts(generalPosts)
                .questionPosts(questionPosts)
                .imagePosts(imagePosts)
                .videoPosts(videoPosts)
                .build();
    }

    /**
     * 사용자 목록 조회 (검색, 필터, 페이지네이션)
     */
    public Page<User> searchUsers(String searchTerm, Role role, Boolean isSuspended, Pageable pageable) {
        LocalDateTime now = LocalDateTime.now();

        // 검색어나 필터가 없으면 전체 조회
        if (searchTerm == null && role == null && isSuspended == null) {
            return userRepository.findAll(pageable);
        }

        // 복합 검색
        return userRepository.searchUsersWithFilters(searchTerm, role, isSuspended, now, pageable);
    }

    /**
     * 사용자 제재
     */
    @Transactional
    public User suspendUser(Long userId, SuspensionRequest request, User admin, HttpServletRequest httpRequest) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("사용자를 찾을 수 없습니다."));

        if (request.getReason() == null || request.getReason().trim().isEmpty()) {
            throw new RuntimeException("제재 사유는 필수입니다.");
        }

        SuspensionHistory.SuspensionType suspensionType;
        LocalDateTime suspendedUntil = null;

        switch (request.getSuspensionType().toUpperCase()) {
            case "TEMPORARY":
                if (request.getDurationDays() == null || request.getDurationDays() <= 0) {
                    throw new RuntimeException("일시 정지는 기간을 지정해야 합니다.");
                }
                suspensionType = SuspensionHistory.SuspensionType.TEMPORARY;
                suspendedUntil = LocalDateTime.now().plusDays(request.getDurationDays());
                user.setSuspendedUntil(suspendedUntil);
                user.setIsPermanentlySuspended(false);
                break;

            case "PERMANENT":
                suspensionType = SuspensionHistory.SuspensionType.PERMANENT;
                user.setIsPermanentlySuspended(true);
                user.setSuspendedUntil(null);
                break;

            case "UNSUSPEND":
                suspensionType = SuspensionHistory.SuspensionType.UNSUSPEND;
                user.setIsPermanentlySuspended(false);
                user.setSuspendedUntil(null);
                user.setSuspensionReason(null);
                break;

            default:
                throw new RuntimeException("잘못된 제재 유형입니다.");
        }

        user.setSuspensionReason(request.getReason());
        userRepository.save(user);

        // 제재 이력 기록
        SuspensionHistory history = SuspensionHistory.builder()
                .user(user)
                .admin(admin)
                .suspensionType(suspensionType)
                .suspendedUntil(suspendedUntil)
                .reason(request.getReason())
                .adminIp(getClientIp(httpRequest))
                .build();
        suspensionHistoryRepository.save(history);

        // 감사 로그 기록
        String description = String.format("사용자 '%s' %s: %s",
                user.getEmail(),
                suspensionType == SuspensionHistory.SuspensionType.UNSUSPEND ? "정지 해제" : "제재",
                request.getReason());
        auditLogService.log(admin, "USER_SUSPENSION", "User", userId, description, httpRequest);

        return user;
    }

    /**
     * 역할 변경
     */
    @Transactional
    public User changeUserRole(Long userId, RoleChangeRequest request, User admin, HttpServletRequest httpRequest) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("사용자를 찾을 수 없습니다."));

        Role oldRole = user.getRole();
        Role newRole;

        try {
            newRole = Role.valueOf(request.getNewRole());
        } catch (IllegalArgumentException e) {
            throw new RuntimeException("잘못된 역할입니다.");
        }

        if (oldRole == newRole) {
            throw new RuntimeException("동일한 역할로 변경할 수 없습니다.");
        }

        user.setRole(newRole);
        userRepository.save(user);

        // 감사 로그 기록
        String description = String.format("사용자 '%s' 역할 변경: %s → %s%s",
                user.getEmail(),
                oldRole,
                newRole,
                request.getReason() != null ? " (사유: " + request.getReason() + ")" : "");
        auditLogService.log(admin, "USER_ROLE_CHANGE", "User", userId, description, httpRequest);

        return user;
    }

    /**
     * 사용자 제재 이력 조회
     */
    public Page<SuspensionHistory> getUserSuspensionHistory(Long userId, Pageable pageable) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("사용자를 찾을 수 없습니다."));
        return suspensionHistoryRepository.findByUserOrderByCreatedAtDesc(user, pageable);
    }

    /**
     * 클라이언트 IP 주소 추출
     */
    private String getClientIp(HttpServletRequest request) {
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
