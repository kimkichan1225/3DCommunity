package com.community.service;

import com.community.dto.StatisticsDTO;
import com.community.model.User;
import com.community.model.PaymentHistory;
import com.community.repository.PaymentHistoryRepository;
import com.community.repository.PostRepository;
import com.community.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class StatisticsService {

    private final UserRepository userRepository;
    private final PaymentHistoryRepository paymentHistoryRepository;
    private final PostRepository postRepository;

    public StatisticsDTO getDashboardStats() {
        LocalDateTime sevenDaysAgo = LocalDateTime.now().minusDays(7);

        // 1. 기본 통계
        long totalUsers = userRepository.count();
        long totalPosts = postRepository.count();
        long activeUsers = userRepository.countByLastLoginAtAfter(sevenDaysAgo);
        
        // 매출 통계 (APPROVED 상태만)
        Long totalRevenueObj = paymentHistoryRepository.sumAmountByStatus(PaymentHistory.PaymentStatus.APPROVED);
        long totalRevenue = totalRevenueObj != null ? totalRevenueObj : 0;

        // 2. 일별 매출 통계 (최근 7일)
        List<StatisticsDTO.DailyStat> dailyRevenue = getDailyRevenueStats(7);

        // 3. 일별 가입자 통계 (최근 7일) - 복잡한 쿼리 대신 간단하게 구현 (Repository 메소드 필요 시 추가)
        // 여기서는 예시로 구현하거나, 별도 쿼리를 추가해야 함. 
        // 일단 Mock 데이터가 아닌, Repository에서 가져오도록 메소드를 추가해야 함.
        List<StatisticsDTO.DailyStat> dailyUserGrowth = getDailyUserGrowthStats(7);

        return StatisticsDTO.builder()
                .totalUsers(totalUsers)
                .totalPosts(totalPosts)
                .totalRevenue(totalRevenue)
                .activeUsers(activeUsers)
                .dailyRevenue(dailyRevenue)
                .dailyUserGrowth(dailyUserGrowth)
                .build();
    }

    private List<StatisticsDTO.DailyStat> getDailyRevenueStats(int days) {
        LocalDateTime startDate = LocalDate.now().minusDays(days - 1).atStartOfDay();
        List<PaymentHistory> recentPayments = paymentHistoryRepository.findAllByCreatedAtAfterAndStatus(
                startDate, PaymentHistory.PaymentStatus.APPROVED);

        Map<String, Long> revenueMap = recentPayments.stream()
                .collect(Collectors.groupingBy(
                        p -> p.getCreatedAt().format(DateTimeFormatter.ISO_DATE),
                        Collectors.summingLong(PaymentHistory::getAmount)
                ));

        return fillMissingDates(revenueMap, days);
    }
    
    // User Growth 통계를 위한 임시 구현 (실제로는 Repository에 countByCreatedAtBetween 필요)
    private List<StatisticsDTO.DailyStat> getDailyUserGrowthStats(int days) {
        LocalDateTime startDate = LocalDate.now().minusDays(days - 1).atStartOfDay();
        List<User> recentUsers = userRepository.findAllByCreatedAtAfter(startDate);

        Map<String, Long> growthMap = recentUsers.stream()
                .collect(Collectors.groupingBy(
                        u -> u.getCreatedAt().format(DateTimeFormatter.ISO_DATE),
                        Collectors.counting()
                ));

        return fillMissingDates(growthMap, days);
    }

    private List<StatisticsDTO.DailyStat> fillMissingDates(Map<String, Long> dataMap, int days) {
        List<StatisticsDTO.DailyStat> result = new ArrayList<>();
        LocalDate end = LocalDate.now();
        LocalDate start = end.minusDays(days - 1);

        for (LocalDate date = start; !date.isAfter(end); date = date.plusDays(1)) {
            String dateStr = date.format(DateTimeFormatter.ISO_DATE);
            result.add(new StatisticsDTO.DailyStat(dateStr, dataMap.getOrDefault(dateStr, 0L)));
        }
        return result;
    }
}
