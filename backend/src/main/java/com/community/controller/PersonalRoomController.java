package com.community.controller;

import com.community.dto.FurnitureDto;
import com.community.dto.RoomDto;
import com.community.service.PersonalRoomService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

/**
 * 개인 룸 REST API 컨트롤러
 */
@RestController
@RequestMapping("/api/rooms")
@RequiredArgsConstructor
@Slf4j
public class PersonalRoomController {

    private final PersonalRoomService personalRoomService;

    /**
     * 모든 활성 방 목록 조회
     */
    @GetMapping
    public ResponseEntity<List<RoomDto>> getAllRooms() {
        List<RoomDto> rooms = personalRoomService.getAllRooms();
        log.info("방 목록 조회 (REST): 방 개수={}", rooms.size());
        return ResponseEntity.ok(rooms);
    }

    /**
     * 특정 위치 주변 방 목록 조회
     */
    @GetMapping("/nearby")
    public ResponseEntity<List<RoomDto>> getNearbyRooms(
            @RequestParam double lng,
            @RequestParam double lat,
            @RequestParam(defaultValue = "10") double radius) {
        List<RoomDto> rooms = personalRoomService.getNearbyRooms(lng, lat, radius);
        log.info("주변 방 목록 조회: lng={}, lat={}, radius={}km, 방 개수={}", 
                lng, lat, radius, rooms.size());
        return ResponseEntity.ok(rooms);
    }

    /**
     * 특정 방 조회
     */
    @GetMapping("/{roomId}")
    public ResponseEntity<RoomDto> getRoom(@PathVariable String roomId) {
        RoomDto room = personalRoomService.getRoom(roomId);
        if (room == null) {
            return ResponseEntity.notFound().build();
        }
        return ResponseEntity.ok(room);
    }

    /**
     * 호스트 ID로 방 조회 (내 방 찾기)
     */
    @GetMapping("/host/{hostId}")
    public ResponseEntity<RoomDto> getRoomByHostId(@PathVariable String hostId) {
        RoomDto room = personalRoomService.getRoomByHostId(hostId);
        if (room == null) {
            return ResponseEntity.notFound().build();
        }
        return ResponseEntity.ok(room);
    }

    /**
     * 호스트가 이미 방을 가지고 있는지 확인
     */
    @GetMapping("/host/{hostId}/exists")
    public ResponseEntity<Map<String, Object>> hasRoom(@PathVariable String hostId) {
        boolean hasRoom = personalRoomService.hasRoom(hostId);
        RoomDto existingRoom = hasRoom ? personalRoomService.getRoomByHostId(hostId) : null;
        
        Map<String, Object> response = new HashMap<>();
        response.put("hasRoom", hasRoom);
        response.put("room", existingRoom);
        
        return ResponseEntity.ok(response);
    }

    /**
     * 방 개수 조회
     */
    @GetMapping("/count")
    public ResponseEntity<Integer> getRoomCount() {
        return ResponseEntity.ok(personalRoomService.getRoomCount());
    }

    /**
     * 방 삭제 (호스트만 가능)
     */
    @DeleteMapping("/{roomId}")
    public ResponseEntity<Map<String, Object>> deleteRoom(
            @PathVariable String roomId,
            @RequestParam String hostId) {
        // 방 정보 확인
        RoomDto room = personalRoomService.getRoom(roomId);
        if (room == null) {
            return ResponseEntity.notFound().build();
        }
        
        // 호스트 확인
        if (!hostId.equals(room.getHostId())) {
            Map<String, Object> error = new HashMap<>();
            error.put("success", false);
            error.put("message", "Only the host can delete the room");
            return ResponseEntity.status(403).body(error);
        }
        
        // 방 삭제
        RoomDto deleted = personalRoomService.deleteRoom(roomId);
        
        Map<String, Object> response = new HashMap<>();
        response.put("success", deleted != null);
        response.put("deletedRoom", deleted);
        
        return ResponseEntity.ok(response);
    }

    // ==================== 가구 관련 API ====================

    /**
     * 방의 모든 가구 조회
     */
    @GetMapping("/{roomId}/furnitures")
    public ResponseEntity<List<FurnitureDto>> getFurnitures(@PathVariable String roomId) {
        List<FurnitureDto> furnitures = personalRoomService.getFurnitures(roomId);
        log.info("가구 목록 조회: roomId={}, 가구 개수={}", roomId, furnitures.size());
        return ResponseEntity.ok(furnitures);
    }

    /**
     * 가구 저장 (추가 또는 업데이트)
     */
    @PostMapping("/{roomId}/furnitures")
    public ResponseEntity<FurnitureDto> saveFurniture(
            @PathVariable String roomId,
            @RequestBody FurnitureDto furnitureDto) {
        FurnitureDto saved = personalRoomService.saveFurniture(roomId, furnitureDto);
        if (saved == null) {
            return ResponseEntity.badRequest().build();
        }
        log.info("가구 저장: roomId={}, furnitureId={}", roomId, furnitureDto.getFurnitureId());
        return ResponseEntity.ok(saved);
    }

    /**
     * 여러 가구 일괄 저장
     */
    @PostMapping("/{roomId}/furnitures/batch")
    public ResponseEntity<List<FurnitureDto>> saveFurnitures(
            @PathVariable String roomId,
            @RequestBody List<FurnitureDto> furnitureDtos) {
        List<FurnitureDto> saved = personalRoomService.saveFurnitures(roomId, furnitureDtos);
        log.info("가구 일괄 저장: roomId={}, 저장 개수={}", roomId, saved.size());
        return ResponseEntity.ok(saved);
    }

    /**
     * 가구 삭제 (숨김 처리)
     */
    @DeleteMapping("/{roomId}/furnitures/{furnitureId}")
    public ResponseEntity<Map<String, Boolean>> deleteFurniture(
            @PathVariable String roomId,
            @PathVariable String furnitureId) {
        boolean deleted = personalRoomService.deleteFurniture(roomId, furnitureId);
        
        Map<String, Boolean> response = new HashMap<>();
        response.put("success", deleted);
        
        if (deleted) {
            log.info("가구 삭제: roomId={}, furnitureId={}", roomId, furnitureId);
            return ResponseEntity.ok(response);
        } else {
            return ResponseEntity.notFound().build();
        }
    }
}
