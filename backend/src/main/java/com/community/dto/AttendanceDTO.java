package com.community.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AttendanceDTO {
    private Long id;
    private String eventType;
    private LocalDate attendanceDate;
    private Integer dayNumber;
    private Boolean rewardClaimed;
    private Integer silverCoinsRewarded;
    private Integer goldCoinsRewarded;
}
