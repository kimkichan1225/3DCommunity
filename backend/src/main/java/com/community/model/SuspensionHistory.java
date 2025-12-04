package com.community.model;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

/**
 * 제재 이력 엔티티
 * 사용자에 대한 모든 제재 기록을 저장
 */
@Entity
@Table(name = "suspension_history")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class SuspensionHistory {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    /**
     * 제재받은 사용자
     */
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    /**
     * 제재를 실행한 관리자
     */
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "admin_id", nullable = false)
    private User admin;

    /**
     * 제재 유형 (TEMPORARY: 일시 정지, PERMANENT: 영구 정지, UNSUSPEND: 정지 해제)
     */
    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private SuspensionType suspensionType;

    /**
     * 제재 기간 (일시 정지의 경우)
     */
    @Column(name = "suspended_until")
    private LocalDateTime suspendedUntil;

    /**
     * 제재 사유 (필수)
     */
    @Column(nullable = false, columnDefinition = "TEXT")
    private String reason;

    /**
     * 제재 실행 시간
     */
    @Column(name = "created_at", nullable = false)
    private LocalDateTime createdAt;

    /**
     * 관리자 IP 주소
     */
    @Column(name = "admin_ip", length = 45)
    private String adminIp;

    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
    }

    public enum SuspensionType {
        TEMPORARY,   // 일시 정지
        PERMANENT,   // 영구 정지
        UNSUSPEND    // 정지 해제
    }
}
