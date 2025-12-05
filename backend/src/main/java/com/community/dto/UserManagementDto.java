package com.community.dto;

import com.community.model.Role;
import com.community.model.User;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

/**
 * 관리자 페이지 사용자 목록용 DTO
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class UserManagementDto {

    private Long id;
    private String username;
    private String email;
    private Role role;
    private LocalDateTime createdAt;
    private LocalDateTime lastLoginAt;

    // 제재 관련
    private boolean isSuspended;
    private LocalDateTime suspendedUntil;
    private String suspensionReason;
    private Boolean isPermanentlySuspended;

    /**
     * User 엔티티를 DTO로 변환
     */
    public static UserManagementDto fromEntity(User user) {
        return UserManagementDto.builder()
                .id(user.getId())
                .username(user.getNickname())
                .email(user.getEmail())
                .role(user.getRole())
                .createdAt(user.getCreatedAt())
                .lastLoginAt(user.getLastLoginAt())
                .isSuspended(user.isSuspended())
                .suspendedUntil(user.getSuspendedUntil())
                .suspensionReason(user.getSuspensionReason())
                .isPermanentlySuspended(user.getIsPermanentlySuspended())
                .build();
    }
}
