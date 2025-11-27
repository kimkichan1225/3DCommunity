package com.community.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class DashboardStatsDto {

    // 사용자 통계
    private long totalUsers;
    private long todayNewUsers;
    private long onlineUsers;

    // 게시판 통계
    private long totalPosts;
    private long totalComments;
    private long pendingReports;

    // 시스템 통계
    private long activeRooms;
    private long todayRevenue;
    private long monthlyRevenue;
}
