package com.community.repository;

import com.community.model.PersonalRoom;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface PersonalRoomRepository extends JpaRepository<PersonalRoom, Long> {

    /**
     * roomId로 방 조회
     */
    Optional<PersonalRoom> findByRoomId(String roomId);

    /**
     * hostId로 방 조회 (각 사용자는 하나의 방만 가질 수 있음)
     */
    Optional<PersonalRoom> findByHostId(Long hostId);

    /**
     * hostId로 활성 방 조회
     */
    Optional<PersonalRoom> findByHostIdAndIsActiveTrue(Long hostId);

    /**
     * 모든 활성 방 조회
     */
    List<PersonalRoom> findByIsActiveTrue();

    /**
     * 호스트가 이미 방을 가지고 있는지 확인
     */
    boolean existsByHostId(Long hostId);

    /**
     * roomId로 방 삭제
     */
    void deleteByRoomId(String roomId);
}
