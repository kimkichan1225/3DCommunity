package com.community.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AttendanceClaimResponse {
    private boolean success;
    private String message;
    private AttendanceDTO attendance;
    private Integer totalSilverCoins; // 현재 총 실버 코인
    private Integer totalGoldCoins; // 현재 총 골드 코인
}
