package com.community.model;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Entity
@Table(name = "audit_logs")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AuditLog {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "admin_id", nullable = false)
    private User admin;

    @Column(nullable = false, length = 50)
    private String action; // 작업 유형 (예: USER_BAN, POST_DELETE, NOTICE_CREATE)

    @Column(length = 100)
    private String targetType; // 대상 타입 (예: User, Post, Notice)

    @Column
    private Long targetId; // 대상 ID

    @Column(columnDefinition = "TEXT")
    private String description; // 작업 설명 (변경 내용 등)

    @Column(length = 45)
    private String ipAddress; // 관리자 IP

    @Column(name = "created_at", nullable = false)
    private LocalDateTime createdAt;

    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
    }
}
