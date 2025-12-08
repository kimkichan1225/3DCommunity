package com.community.controller;

import com.community.dto.AttendanceClaimResponse;
import com.community.dto.AttendanceDTO;
import com.community.security.JwtTokenProvider;
import com.community.service.AttendanceService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/attendance")
@RequiredArgsConstructor
public class AttendanceController {

    private final AttendanceService attendanceService;
    private final JwtTokenProvider jwtTokenProvider;

    /**
     * 특정 이벤트의 출석 기록 조회
     */
    @GetMapping("/{eventType}")
    public ResponseEntity<List<AttendanceDTO>> getAttendanceHistory(
            @RequestHeader("Authorization") String token,
            @PathVariable String eventType) {

        Long userId = jwtTokenProvider.getUserIdFromToken(token.replace("Bearer ", ""));
        List<AttendanceDTO> history = attendanceService.getAttendanceHistory(userId, eventType);
        return ResponseEntity.ok(history);
    }

    /**
     * 오늘 출석 체크 여부 확인
     */
    @GetMapping("/{eventType}/today")
    public ResponseEntity<Map<String, Boolean>> checkTodayAttendance(
            @RequestHeader("Authorization") String token,
            @PathVariable String eventType) {

        Long userId = jwtTokenProvider.getUserIdFromToken(token.replace("Bearer ", ""));
        boolean attended = attendanceService.hasAttendedToday(userId, eventType);

        Map<String, Boolean> response = new HashMap<>();
        response.put("attended", attended);
        return ResponseEntity.ok(response);
    }

    /**
     * 출석 체크 및 보상 수령
     */
    @PostMapping("/{eventType}/claim")
    public ResponseEntity<AttendanceClaimResponse> claimAttendance(
            @RequestHeader("Authorization") String token,
            @PathVariable String eventType) {

        Long userId = jwtTokenProvider.getUserIdFromToken(token.replace("Bearer ", ""));
        AttendanceClaimResponse response = attendanceService.claimAttendance(userId, eventType);

        if (response.isSuccess()) {
            return ResponseEntity.ok(response);
        } else {
            return ResponseEntity.badRequest().body(response);
        }
    }
}
