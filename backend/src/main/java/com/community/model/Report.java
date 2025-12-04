package com.community.model;

import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;

@Entity
@Table(name = "reports")
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class Report {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private ReportType reportType; // POST, COMMENT, USER

    @Column(nullable = false)
    private Long targetId; // 신고 대상의 ID

    @Column(length = 500)
    private String targetTitle; // 신고 대상의 제목 (게시글/댓글 내용 일부)

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "reporter_id", nullable = false)
    private User reporter; // 신고자

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "target_user_id")
    private User targetUser; // 신고 대상 사용자

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private ReportReason reason; // 신고 사유

    @Column(length = 1000)
    private String description; // 상세 설명

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    @Builder.Default
    private ReportStatus status = ReportStatus.PENDING; // 처리 상태

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "admin_id")
    private User admin; // 처리한 관리자

    @Column(length = 1000)
    private String adminNote; // 관리자 메모

    @Column(nullable = false, updatable = false)
    @Builder.Default
    private LocalDateTime createdAt = LocalDateTime.now();

    @Column
    private LocalDateTime processedAt; // 처리 완료 시간

    // 신고 유형
    public enum ReportType {
        POST("게시글"),
        COMMENT("댓글"),
        USER("사용자");

        private final String description;

        ReportType(String description) {
            this.description = description;
        }

        public String getDescription() {
            return description;
        }
    }

    // 신고 사유
    public enum ReportReason {
        SPAM("스팸/광고"),
        ABUSE("욕설/비방"),
        SEXUAL("음란물"),
        ILLEGAL("불법 정보"),
        COPYRIGHT("저작권 침해"),
        PRIVACY("개인정보 노출"),
        FAKE_NEWS("허위 정보"),
        ETC("기타");

        private final String description;

        ReportReason(String description) {
            this.description = description;
        }

        public String getDescription() {
            return description;
        }
    }

    // 처리 상태
    public enum ReportStatus {
        PENDING("대기 중"),
        ACCEPTED("승인 (조치 완료)"),
        REJECTED("반려 (문제 없음)");

        private final String description;

        ReportStatus(String description) {
            this.description = description;
        }

        public String getDescription() {
            return description;
        }
    }
}
