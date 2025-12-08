package com.community.controller;

import com.community.dto.AttendanceClaimResponse;
import com.community.dto.AttendanceDTO;
import com.community.model.User;
import com.community.service.AttendanceService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/attendance")
@RequiredArgsConstructor
public class AttendanceController {

    private final AttendanceService attendanceService;

    /**
     * 특정 이벤트의 출석 기록 조회
     */
    @GetMapping("/{eventType}")
    public ResponseEntity<List<AttendanceDTO>> getAttendanceHistory(
            @AuthenticationPrincipal User user,
            @PathVariable String eventType) {

        List<AttendanceDTO> history = attendanceService.getAttendanceHistory(user.getId(), eventType);
        return ResponseEntity.ok(history);
    }

    /**
     * 오늘 출석 체크 여부 확인
     */
    @GetMapping("/{eventType}/today")
    public ResponseEntity<Map<String, Boolean>> checkTodayAttendance(
            @AuthenticationPrincipal User user,
            @PathVariable String eventType) {

        boolean attended = attendanceService.hasAttendedToday(user.getId(), eventType);

        Map<String, Boolean> response = new HashMap<>();
        response.put("attended", attended);
        return ResponseEntity.ok(response);
    }

    /**
     * 출석 체크 및 보상 수령
     */
    @PostMapping("/{eventType}/claim")
    public ResponseEntity<AttendanceClaimResponse> claimAttendance(
            @AuthenticationPrincipal User user,
            @PathVariable String eventType) {

        AttendanceClaimResponse response = attendanceService.claimAttendance(user.getId(), eventType);

        if (response.isSuccess()) {
            return ResponseEntity.ok(response);
        } else {
            return ResponseEntity.badRequest().body(response);
        }
    }
}
