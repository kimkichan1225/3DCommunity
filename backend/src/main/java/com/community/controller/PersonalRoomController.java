package com.community.controller;

import com.community.dto.RoomDto;
import com.community.service.PersonalRoomService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

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
     * @param lng 경도
     * @param lat 위도
     * @param radius 반경 (킬로미터, 기본값 10km)
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
     * 방 개수 조회
     */
    @GetMapping("/count")
    public ResponseEntity<Integer> getRoomCount() {
        return ResponseEntity.ok(personalRoomService.getRoomCount());
    }
}
