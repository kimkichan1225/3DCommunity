package com.community.dto;

import com.community.model.AuditLog;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AuditLogDto {

    private Long id;
    private String adminUsername;
    private String action;
    private String targetType;
    private Long targetId;
    private String description;
    private String ipAddress;
    private LocalDateTime createdAt;

    public static AuditLogDto fromEntity(AuditLog log) {
        return AuditLogDto.builder()
                .id(log.getId())
                .adminUsername(log.getAdmin().getUsername())
                .action(log.getAction())
                .targetType(log.getTargetType())
                .targetId(log.getTargetId())
                .description(log.getDescription())
                .ipAddress(log.getIpAddress())
                .createdAt(log.getCreatedAt())
                .build();
    }
}
