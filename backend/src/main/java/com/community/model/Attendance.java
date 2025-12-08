package com.community.model;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;
import java.time.LocalDateTime;

@Entity
@Table(name = "attendance",
       uniqueConstraints = @UniqueConstraint(columnNames = {"user_id", "event_type", "attendance_date"}))
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class Attendance {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @Column(name = "event_type", nullable = false, length = 20)
    private String eventType; // "DAILY" (매일 출석 체크) 또는 "EVENT" (오픈 기념 출석 체크)

    @Column(name = "attendance_date", nullable = false)
    private LocalDate attendanceDate; // 출석한 날짜

    @Column(name = "day_number", nullable = false)
    private Integer dayNumber; // 연속 출석 일수 (1, 2, 3, ...)

    @Column(name = "reward_claimed", nullable = false)
    private Boolean rewardClaimed = true; // 보상 수령 여부 (항상 true로 저장)

    @Column(name = "silver_coins_rewarded")
    private Integer silverCoinsRewarded; // 지급된 실버 코인

    @Column(name = "gold_coins_rewarded")
    private Integer goldCoinsRewarded; // 지급된 골드 코인

    @Column(name = "created_at")
    private LocalDateTime createdAt;

    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
    }
}
