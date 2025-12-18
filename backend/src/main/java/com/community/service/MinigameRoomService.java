package com.community.service;

import com.community.dto.MinigamePlayerDto;
import com.community.dto.MinigameRoomDto;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.util.*;
import java.util.concurrent.ConcurrentHashMap;

@Service
@Slf4j
public class MinigameRoomService {

    private final Map<String, MinigameRoomDto> rooms = new ConcurrentHashMap<>();

    /**
     * 방 생성
     */
    public MinigameRoomDto createRoom(String roomName, String gameName, String hostId, String hostName,
                                       int maxPlayers, boolean isLocked, int hostLevel,
                                       String selectedProfile, String selectedOutline) {
        String roomId = UUID.randomUUID().toString();

        MinigameRoomDto room = new MinigameRoomDto();
        room.setRoomId(roomId);
        room.setRoomName(roomName);
        room.setGameName(gameName);
        room.setHostId(hostId);
        room.setHostName(hostName);
        room.setMaxPlayers(maxPlayers);
        room.setLocked(isLocked);
        room.setPlaying(false);
        room.setCurrentPlayers(1);

        MinigamePlayerDto host = new MinigamePlayerDto();
        host.setUserId(hostId);
        host.setUsername(hostName);
        host.setLevel(hostLevel);
        host.setHost(true);
        host.setReady(true);
        host.setSelectedProfile(selectedProfile);
        host.setSelectedOutline(selectedOutline);

        room.getPlayers().add(host);
        rooms.put(roomId, room);

        log.info("방 생성: {} (ID: {})", roomName, roomId);
        return room;
    }

    /**
     * 방 목록 조회
     */
    public List<MinigameRoomDto> getAllRooms() {
        return new ArrayList<>(rooms.values());
    }

    /**
     * 방 조회
     */
    public MinigameRoomDto getRoom(String roomId) {
        return rooms.get(roomId);
    }

    /**
     * 방 입장
     */
    public MinigameRoomDto joinRoom(String roomId, MinigamePlayerDto player) {
        MinigameRoomDto room = rooms.get(roomId);
        if (room == null) {
            log.error("방을 찾을 수 없습니다: {}", roomId);
            return null;
        }

        if (room.getCurrentPlayers() >= room.getMaxPlayers()) {
            log.error("방이 가득 찼습니다: {}", roomId);
            return null;
        }

        room.getPlayers().add(player);
        room.setCurrentPlayers(room.getCurrentPlayers() + 1);

        log.info("플레이어 {} 방 입장: {}", player.getUsername(), roomId);
        return room;
    }

    /**
     * 방 나가기
     */
    public MinigameRoomDto leaveRoom(String roomId, String userId) {
        MinigameRoomDto room = rooms.get(roomId);
        if (room == null) {
            return null;
        }

        room.getPlayers().removeIf(p -> p.getUserId().equals(userId));
        room.setCurrentPlayers(room.getPlayers().size());

        // 방장이 나갔을 때
        if (room.getHostId().equals(userId)) {
            if (room.getPlayers().isEmpty()) {
                // 방 삭제
                rooms.remove(roomId);
                log.info("방 삭제: {}", roomId);
                return null;
            } else {
                // 다음 사람을 방장으로 지정
                MinigamePlayerDto newHost = room.getPlayers().get(0);
                newHost.setHost(true);
                room.setHostId(newHost.getUserId());
                room.setHostName(newHost.getUsername());
                log.info("새로운 방장: {}", newHost.getUsername());
            }
        }

        log.info("플레이어 {} 방 나가기: {}", userId, roomId);
        return room;
    }

    /**
     * 방 설정 변경
     */
    public MinigameRoomDto updateRoomSettings(String roomId, String gameName, int maxPlayers) {
        MinigameRoomDto room = rooms.get(roomId);
        if (room == null) {
            return null;
        }

        room.setGameName(gameName);
        room.setMaxPlayers(maxPlayers);

        log.info("방 설정 변경: {} - 게임: {}, 최대 인원: {}", roomId, gameName, maxPlayers);
        return room;
    }

    /**
     * 준비 상태 변경
     */
    public MinigameRoomDto toggleReady(String roomId, String userId) {
        MinigameRoomDto room = rooms.get(roomId);
        if (room == null) {
            return null;
        }

        room.getPlayers().stream()
                .filter(p -> p.getUserId().equals(userId))
                .findFirst()
                .ifPresent(p -> p.setReady(!p.isReady()));

        return room;
    }

    /**
     * 게임 시작
     */
    public MinigameRoomDto startGame(String roomId) {
        MinigameRoomDto room = rooms.get(roomId);
        if (room == null) {
            return null;
        }

        room.setPlaying(true);
        log.info("게임 시작: {}", roomId);
        return room;
    }
}
