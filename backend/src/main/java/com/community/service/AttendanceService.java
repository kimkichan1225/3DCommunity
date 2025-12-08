package com.community.service;

import com.community.dto.AttendanceClaimResponse;
import com.community.dto.AttendanceDTO;
import com.community.model.Attendance;
import com.community.model.User;
import com.community.repository.AttendanceRepository;
import com.community.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.temporal.ChronoUnit;
import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class AttendanceService {

    private final AttendanceRepository attendanceRepository;
    private final UserRepository userRepository;
    private final CurrencyService currencyService;

    /**
     * 특정 사용자의 특정 이벤트 타입의 모든 출석 기록 조회
     */
    public List<AttendanceDTO> getAttendanceHistory(Long userId, String eventType) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found"));

        return attendanceRepository.findByUserAndEventTypeOrderByDayNumberAsc(user, eventType)
                .stream()
                .map(this::convertToDTO)
                .collect(Collectors.toList());
    }

    /**
     * 오늘 출석 체크 여부 확인
     */
    public boolean hasAttendedToday(Long userId, String eventType) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found"));

        return attendanceRepository.existsByUserAndEventTypeAndAttendanceDate(
                user, eventType, LocalDate.now()
        );
    }

    /**
     * 출석 체크 및 보상 지급
     */
    @Transactional
    public AttendanceClaimResponse claimAttendance(Long userId, String eventType) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found"));

        LocalDate today = LocalDate.now();

        // 오늘 이미 출석했는지 확인
        if (attendanceRepository.existsByUserAndEventTypeAndAttendanceDate(user, eventType, today)) {
            return AttendanceClaimResponse.builder()
                    .success(false)
                    .message("Already attended today")
                    .build();
        }

        // 마지막 출석 기록 조회
        Optional<Attendance> lastAttendanceOpt = attendanceRepository.findLastAttendanceByUserAndEventType(user, eventType);

        int nextDayNumber = 1;
        if (lastAttendanceOpt.isPresent()) {
            Attendance lastAttendance = lastAttendanceOpt.get();

            // 마지막 출석이 Day 14였으면 Day 1부터 다시 시작
            if (lastAttendance.getDayNumber() == 14) {
                nextDayNumber = 1;
            } else {
                // 아니면 다음 날짜로 증가 (하루 이상 건너뛰어도 연속 유지)
                nextDayNumber = lastAttendance.getDayNumber() + 1;
            }
        }

        // 보상 계산
        int silverCoins = 0;
        int goldCoins = 0;

        if ("DAILY".equals(eventType)) {
            // 매일 출석 체크: Day 7, 14에 골드, 나머지는 실버
            if (nextDayNumber == 7 || nextDayNumber == 14) {
                goldCoins = 50;
            } else {
                silverCoins = 100;
            }
        } else if ("EVENT".equals(eventType)) {
            // 오픈 기념 출석 체크: Day 7, 14에 골드, 나머지는 실버
            if (nextDayNumber == 7 || nextDayNumber == 14) {
                goldCoins = 100;
            } else {
                silverCoins = 200;
            }
        }

        // 출석 기록 저장
        Attendance attendance = Attendance.builder()
                .user(user)
                .eventType(eventType)
                .attendanceDate(today)
                .dayNumber(nextDayNumber)
                .rewardClaimed(true)
                .silverCoinsRewarded(silverCoins)
                .goldCoinsRewarded(goldCoins)
                .build();

        attendance = attendanceRepository.save(attendance);

        // 보상 지급
        if (silverCoins > 0) {
            currencyService.addSilverCoins(userId, silverCoins);
        }
        if (goldCoins > 0) {
            currencyService.addGoldCoins(userId, goldCoins);
        }

        // 현재 총 코인 조회
        var currency = currencyService.getCurrency(userId);

        return AttendanceClaimResponse.builder()
                .success(true)
                .message("Attendance claimed successfully")
                .attendance(convertToDTO(attendance))
                .totalSilverCoins(currency.getSilverCoins())
                .totalGoldCoins(currency.getGoldCoins())
                .build();
    }

    private AttendanceDTO convertToDTO(Attendance attendance) {
        return AttendanceDTO.builder()
                .id(attendance.getId())
                .eventType(attendance.getEventType())
                .attendanceDate(attendance.getAttendanceDate())
                .dayNumber(attendance.getDayNumber())
                .rewardClaimed(attendance.getRewardClaimed())
                .silverCoinsRewarded(attendance.getSilverCoinsRewarded())
                .goldCoinsRewarded(attendance.getGoldCoinsRewarded())
                .build();
    }
}
