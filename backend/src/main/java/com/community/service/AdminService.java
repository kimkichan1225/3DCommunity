package com.community.service;

import com.community.dto.DashboardStatsDto;
import com.community.repository.PostRepository;
import com.community.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.time.LocalDateTime;

@Service
@RequiredArgsConstructor
public class AdminService {

    private final UserRepository userRepository;
    private final PostRepository postRepository;

    /**
     * 대시보드 통계 데이터 조회
     */
    public DashboardStatsDto getDashboardStats() {
        long totalUsers = userRepository.count();

        // 오늘 가입한 사용자 (00:00:00 ~ 23:59:59)
        LocalDateTime todayStart = LocalDate.now().atStartOfDay();
        LocalDateTime todayEnd = todayStart.plusDays(1);

        // TODO: 실제 구현 시 커스텀 쿼리 필요
        long todayNewUsers = 0; // userRepository.countByCreatedAtBetween(todayStart, todayEnd);

        // TODO: 실시간 접속자는 WebSocket 또는 Redis 기반으로 구현 필요
        long onlineUsers = 0;

        long totalPosts = postRepository.count();

        // TODO: Comment Repository에서 조회
        long totalComments = 0;

        // TODO: Report 엔티티 생성 후 구현
        long pendingReports = 0;

        // TODO: Room 엔티티 생성 후 구현
        long activeRooms = 0;

        // TODO: Payment 엔티티 생성 후 구현
        long todayRevenue = 0;
        long monthlyRevenue = 0;

        return DashboardStatsDto.builder()
                .totalUsers(totalUsers)
                .todayNewUsers(todayNewUsers)
                .onlineUsers(onlineUsers)
                .totalPosts(totalPosts)
                .totalComments(totalComments)
                .pendingReports(pendingReports)
                .activeRooms(activeRooms)
                .todayRevenue(todayRevenue)
                .monthlyRevenue(monthlyRevenue)
                .build();
    }
}
