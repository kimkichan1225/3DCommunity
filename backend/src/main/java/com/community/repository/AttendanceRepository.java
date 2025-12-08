package com.community.repository;

import com.community.model.Attendance;
import com.community.model.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

@Repository
public interface AttendanceRepository extends JpaRepository<Attendance, Long> {

    // 특정 사용자의 특정 이벤트 타입의 모든 출석 기록 조회
    List<Attendance> findByUserAndEventTypeOrderByDayNumberAsc(User user, String eventType);

    // 특정 사용자의 특정 이벤트 타입의 특정 날짜 출석 기록 조회
    Optional<Attendance> findByUserAndEventTypeAndAttendanceDate(User user, String eventType, LocalDate attendanceDate);

    // 특정 사용자의 특정 이벤트 타입의 마지막 출석 기록 조회
    @Query("SELECT a FROM Attendance a WHERE a.user = :user AND a.eventType = :eventType ORDER BY a.dayNumber DESC LIMIT 1")
    Optional<Attendance> findLastAttendanceByUserAndEventType(@Param("user") User user, @Param("eventType") String eventType);

    // 특정 사용자의 특정 이벤트 타입의 오늘 출석 여부 확인
    boolean existsByUserAndEventTypeAndAttendanceDate(User user, String eventType, LocalDate attendanceDate);
}
