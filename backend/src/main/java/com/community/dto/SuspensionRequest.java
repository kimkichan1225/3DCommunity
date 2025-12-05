package com.community.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * 제재 요청 DTO
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
public class SuspensionRequest {

    /**
     * 제재 유형 (TEMPORARY: 일시 정지, PERMANENT: 영구 정지, UNSUSPEND: 정지 해제)
     */
    private String suspensionType;

    /**
     * 제재 기간 (일 단위, TEMPORARY인 경우만 사용)
     * 1, 7, 30 등
     */
    private Integer durationDays;

    /**
     * 제재 사유 (필수)
     */
    private String reason;
}
