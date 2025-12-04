package com.community.dto;

import com.community.model.SuspensionHistory;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

/**
 * 제재 이력 DTO
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class SuspensionHistoryDto {

    private Long id;
    private Long userId;
    private String username;
    private Long adminId;
    private String adminName;
    private String suspensionType;
    private LocalDateTime suspendedUntil;
    private String reason;
    private LocalDateTime createdAt;

    /**
     * SuspensionHistory 엔티티를 DTO로 변환
     */
    public static SuspensionHistoryDto fromEntity(SuspensionHistory history) {
        return SuspensionHistoryDto.builder()
                .id(history.getId())
                .userId(history.getUser().getId())
                .username(history.getUser().getNickname())
                .adminId(history.getAdmin().getId())
                .adminName(history.getAdmin().getNickname())
                .suspensionType(history.getSuspensionType().name())
                .suspendedUntil(history.getSuspendedUntil())
                .reason(history.getReason())
                .createdAt(history.getCreatedAt())
                .build();
    }
}
