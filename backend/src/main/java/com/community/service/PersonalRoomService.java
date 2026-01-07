package com.community.service;

import com.community.dto.RoomDto;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

/**
 * 개인 룸 관리 서비스
 * 메모리 내에서 활성화된 개인 룸 목록을 관리합니다.
 */
@Service
@Slf4j
public class PersonalRoomService {

    // roomId -> RoomDto 매핑
    private final Map<String, RoomDto> activeRooms = new ConcurrentHashMap<>();
    
    // hostId -> roomId 매핑 (호스트가 만든 방 추적)
    private final Map<String, String> hostToRoom = new ConcurrentHashMap<>();

    /**
     * 방 생성
     * @param roomDto 방 정보
     * @return 생성된 방 정보
     */
    public RoomDto createRoom(RoomDto roomDto) {
        if (roomDto == null || roomDto.getRoomId() == null) {
            log.warn("Invalid room data for creation");
            return null;
        }
        
        String roomId = roomDto.getRoomId();
        String hostId = roomDto.getHostId();
        
        // 이미 존재하는 방인지 확인
        if (activeRooms.containsKey(roomId)) {
            log.warn("Room already exists: {}", roomId);
            return activeRooms.get(roomId);
        }
        
        // 호스트가 이미 방을 가지고 있는지 확인
        if (hostId != null && hostToRoom.containsKey(hostId)) {
            String existingRoomId = hostToRoom.get(hostId);
            log.warn("Host {} already has a room: {}. Removing old room.", hostId, existingRoomId);
            deleteRoom(existingRoomId);
        }
        
        // 방 저장
        roomDto.setAction("create");
        roomDto.setTimestamp(System.currentTimeMillis());
        activeRooms.put(roomId, roomDto);
        
        if (hostId != null) {
            hostToRoom.put(hostId, roomId);
        }
        
        log.info("Room created: roomId={}, roomName={}, hostId={}", 
                roomId, roomDto.getRoomName(), hostId);
        
        return roomDto;
    }

    /**
     * 방 삭제
     * @param roomId 방 ID
     * @return 삭제된 방 정보 (없으면 null)
     */
    public RoomDto deleteRoom(String roomId) {
        if (roomId == null) {
            return null;
        }
        
        RoomDto removed = activeRooms.remove(roomId);
        
        if (removed != null) {
            // 호스트 매핑도 제거
            String hostId = removed.getHostId();
            if (hostId != null) {
                hostToRoom.remove(hostId);
            }
            
            removed.setAction("delete");
            removed.setTimestamp(System.currentTimeMillis());
            
            log.info("Room deleted: roomId={}", roomId);
        }
        
        return removed;
    }

    /**
     * 방 조회
     * @param roomId 방 ID
     * @return 방 정보 (없으면 null)
     */
    public RoomDto getRoom(String roomId) {
        return activeRooms.get(roomId);
    }

    /**
     * 모든 활성 방 목록 조회
     * @return 활성 방 목록
     */
    public List<RoomDto> getAllRooms() {
        return new ArrayList<>(activeRooms.values());
    }

    /**
     * 호스트 ID로 방 조회
     * @param hostId 호스트 ID
     * @return 방 정보 (없으면 null)
     */
    public RoomDto getRoomByHostId(String hostId) {
        String roomId = hostToRoom.get(hostId);
        if (roomId != null) {
            return activeRooms.get(roomId);
        }
        return null;
    }

    /**
     * 호스트가 나갈 때 방 삭제
     * @param hostId 호스트 ID
     * @return 삭제된 방 정보 (없으면 null)
     */
    public RoomDto deleteRoomByHostId(String hostId) {
        String roomId = hostToRoom.get(hostId);
        if (roomId != null) {
            return deleteRoom(roomId);
        }
        return null;
    }

    /**
     * 활성 방 개수
     * @return 방 개수
     */
    public int getRoomCount() {
        return activeRooms.size();
    }

    /**
     * 특정 위치 주변의 방 목록 조회 (GPS 기반)
     * @param lng 경도
     * @param lat 위도
     * @param radiusKm 반경 (킬로미터)
     * @return 주변 방 목록
     */
    public List<RoomDto> getNearbyRooms(double lng, double lat, double radiusKm) {
        List<RoomDto> nearbyRooms = new ArrayList<>();
        
        for (RoomDto room : activeRooms.values()) {
            if (room.getGpsLng() != null && room.getGpsLat() != null) {
                double distance = calculateDistance(lat, lng, room.getGpsLat(), room.getGpsLng());
                if (distance <= radiusKm) {
                    nearbyRooms.add(room);
                }
            } else {
                // GPS 정보가 없는 방은 모두 포함 (전역 방)
                nearbyRooms.add(room);
            }
        }
        
        return nearbyRooms;
    }

    /**
     * 두 GPS 좌표 사이의 거리 계산 (Haversine 공식)
     * @return 거리 (킬로미터)
     */
    private double calculateDistance(double lat1, double lng1, double lat2, double lng2) {
        final double R = 6371; // 지구 반경 (km)
        
        double latDistance = Math.toRadians(lat2 - lat1);
        double lngDistance = Math.toRadians(lng2 - lng1);
        
        double a = Math.sin(latDistance / 2) * Math.sin(latDistance / 2)
                + Math.cos(Math.toRadians(lat1)) * Math.cos(Math.toRadians(lat2))
                * Math.sin(lngDistance / 2) * Math.sin(lngDistance / 2);
        
        double c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        
        return R * c;
    }
}
