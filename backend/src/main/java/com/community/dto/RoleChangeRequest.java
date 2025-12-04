package com.community.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * 역할 변경 요청 DTO
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
public class RoleChangeRequest {

    /**
     * 새로운 역할 (ROLE_USER, ROLE_ADMIN, ROLE_DEVELOPER)
     */
    private String newRole;

    /**
     * 변경 사유 (선택)
     */
    private String reason;
}
