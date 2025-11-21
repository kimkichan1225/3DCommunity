package com.community.repository;

import com.community.model.UserSession;
import com.community.model.UserSession.SpaceType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@Repository
public interface UserSessionRepository extends JpaRepository<UserSession, Long> {

    Optional<UserSession> findByUserId(Long userId);

    // 광장에 있는 모든 사용자 조회
    List<UserSession> findByCurrentSpaceType(SpaceType spaceType);

    // 특정 로컬 방에 있는 모든 사용자 조회
    List<UserSession> findByCurrentSpaceTypeAndCurrentRoomId(SpaceType spaceType, Long roomId);

    // 활성 사용자 조회 (마지막 활동 시간 기준)
    @Query("SELECT us FROM UserSession us WHERE us.lastActiveAt > :threshold")
    List<UserSession> findActiveUsers(@Param("threshold") LocalDateTime threshold);

    // 특정 공간의 활성 사용자 수
    @Query("SELECT COUNT(us) FROM UserSession us WHERE us.currentSpaceType = :spaceType AND us.lastActiveAt > :threshold")
    Long countActiveUsersBySpaceType(@Param("spaceType") SpaceType spaceType, @Param("threshold") LocalDateTime threshold);

    // 특정 로컬 방의 활성 사용자 수
    @Query("SELECT COUNT(us) FROM UserSession us WHERE us.currentSpaceType = :spaceType AND us.currentRoomId = :roomId AND us.lastActiveAt > :threshold")
    Long countActiveUsersByRoom(@Param("spaceType") SpaceType spaceType, @Param("roomId") Long roomId, @Param("threshold") LocalDateTime threshold);
}
