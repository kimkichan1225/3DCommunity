package com.community.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class StatisticsDTO {
    // 요약 카드용
    private long totalUsers;
    private long totalPosts;
    private long totalRevenue;
    private long activeUsers; // 최근 7일 로그인

    // 그래프용 (키: 날짜, 값: 수치)
    private List<DailyStat> dailyRevenue;
    private List<DailyStat> dailyUserGrowth;

    @Data
    @AllArgsConstructor
    public static class DailyStat {
        private String date; // YYYY-MM-DD
        private long value;
    }
}
