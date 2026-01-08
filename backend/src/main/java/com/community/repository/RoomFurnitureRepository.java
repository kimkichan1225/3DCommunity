package com.community.repository;

import com.community.model.RoomFurniture;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface RoomFurnitureRepository extends JpaRepository<RoomFurniture, Long> {

    /**
     * 특정 방의 모든 가구 조회
     */
    List<RoomFurniture> findByPersonalRoomId(Long personalRoomId);

    /**
     * 특정 방의 보이는 가구만 조회
     */
    List<RoomFurniture> findByPersonalRoomIdAndIsVisibleTrue(Long personalRoomId);

    /**
     * 특정 가구 조회 (방 ID + 가구 ID)
     */
    Optional<RoomFurniture> findByPersonalRoomIdAndFurnitureId(Long personalRoomId, String furnitureId);

    /**
     * 특정 방의 모든 가구 삭제
     */
    void deleteByPersonalRoomId(Long personalRoomId);

    /**
     * 특정 가구 삭제
     */
    void deleteByPersonalRoomIdAndFurnitureId(Long personalRoomId, String furnitureId);
}
