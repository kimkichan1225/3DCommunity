package com.community.dto;

import com.community.model.Report;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

public class ReportDto {

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    public static class CreateRequest {
        private Report.ReportType reportType; // POST, COMMENT, USER
        private Long targetId; // 신고 대상 ID
        private Report.ReportReason reason; // 신고 사유
        private String description; // 상세 설명
    }

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    public static class ProcessRequest {
        private Report.ReportStatus status; // ACCEPTED, REJECTED
        private String adminNote; // 관리자 메모
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class Response {
        private Long id;
        private Report.ReportType reportType;
        private String reportTypeDescription;
        private Long targetId;
        private String targetTitle; // 신고 대상 제목/내용
        private Long reporterId;
        private String reporterName;
        private Long targetUserId;
        private String targetUserName;
        private Report.ReportReason reason;
        private String reasonDescription;
        private String description;
        private Report.ReportStatus status;
        private String statusDescription;
        private Long adminId;
        private String adminName;
        private String adminNote;
        private LocalDateTime createdAt;
        private LocalDateTime processedAt;

        public static Response fromEntity(Report report) {
            return Response.builder()
                    .id(report.getId())
                    .reportType(report.getReportType())
                    .reportTypeDescription(report.getReportType().getDescription())
                    .targetId(report.getTargetId())
                    .targetTitle(report.getTargetTitle())
                    .reporterId(report.getReporter().getId())
                    .reporterName(report.getReporter().getNickname())
                    .targetUserId(report.getTargetUser() != null ? report.getTargetUser().getId() : null)
                    .targetUserName(report.getTargetUser() != null ? report.getTargetUser().getNickname() : null)
                    .reason(report.getReason())
                    .reasonDescription(report.getReason().getDescription())
                    .description(report.getDescription())
                    .status(report.getStatus())
                    .statusDescription(report.getStatus().getDescription())
                    .adminId(report.getAdmin() != null ? report.getAdmin().getId() : null)
                    .adminName(report.getAdmin() != null ? report.getAdmin().getNickname() : null)
                    .adminNote(report.getAdminNote())
                    .createdAt(report.getCreatedAt())
                    .processedAt(report.getProcessedAt())
                    .build();
        }
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class ListResponse {
        private Long id;
        private Report.ReportType reportType;
        private String reportTypeDescription;
        private String targetTitle;
        private String reporterName;
        private String targetUserName;
        private Report.ReportReason reason;
        private String reasonDescription;
        private Report.ReportStatus status;
        private String statusDescription;
        private LocalDateTime createdAt;

        public static ListResponse fromEntity(Report report) {
            return ListResponse.builder()
                    .id(report.getId())
                    .reportType(report.getReportType())
                    .reportTypeDescription(report.getReportType().getDescription())
                    .targetTitle(report.getTargetTitle())
                    .reporterName(report.getReporter().getNickname())
                    .targetUserName(report.getTargetUser() != null ? report.getTargetUser().getNickname() : null)
                    .reason(report.getReason())
                    .reasonDescription(report.getReason().getDescription())
                    .status(report.getStatus())
                    .statusDescription(report.getStatus().getDescription())
                    .createdAt(report.getCreatedAt())
                    .build();
        }
    }
}
