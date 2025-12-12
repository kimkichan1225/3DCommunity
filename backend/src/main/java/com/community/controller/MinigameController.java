package com.community.controller;

import com.community.dto.*;
import com.community.service.MinigameRoomService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.messaging.handler.annotation.MessageMapping;
import org.springframework.messaging.handler.annotation.SendTo;
import org.springframework.messaging.simp.SimpMessageSendingOperations;
import org.springframework.stereotype.Controller;

import java.util.List;

@Controller
@RequiredArgsConstructor
@Slf4j
public class MinigameController {

    private final MinigameRoomService roomService;
    private final SimpMessageSendingOperations messagingTemplate;

    /**
     * 방 생성
     * Client -> /app/minigame.room.create
     * Server -> /topic/minigame/rooms (broadcast)
     */
    @MessageMapping("/minigame.room.create")
    @SendTo("/topic/minigame/rooms")
    public MinigameRoomDto createRoom(CreateRoomRequest request) {
        log.info("방 생성 요청: {}", request);

        MinigameRoomDto room = roomService.createRoom(
            request.getRoomName(),
            request.getGameName(),
            request.getHostId(),
            request.getHostName(),
            request.getMaxPlayers(),
            request.isLocked(),
            request.getHostLevel(),
            request.getSelectedProfile(),
            request.getSelectedOutline()
        );
        room.setAction("create");
        room.setTimestamp(System.currentTimeMillis());

        return room;
    }

    /**
     * 방 목록 요청
     * Client -> /app/minigame.rooms.list
     * Server -> /topic/minigame/rooms-list (to sender)
     */
    @MessageMapping("/minigame.rooms.list")
    public void getRoomsList() {
        List<MinigameRoomDto> rooms = roomService.getAllRooms();
        messagingTemplate.convertAndSend("/topic/minigame/rooms-list", rooms);
    }

    /**
     * 방 입장
     * Client -> /app/minigame.room.join
     * Server -> /topic/minigame/room/{roomId} (to room)
     */
    @MessageMapping("/minigame.room.join")
    public void joinRoom(JoinRoomRequest request) {
        log.info("방 입장 요청: {}", request);

        MinigamePlayerDto player = new MinigamePlayerDto();
        player.setUserId(request.getUserId());
        player.setUsername(request.getUsername());
        player.setLevel(request.getLevel());
        player.setHost(false);
        player.setReady(false);
        player.setSelectedProfile(request.getSelectedProfile());
        player.setSelectedOutline(request.getSelectedOutline());

        MinigameRoomDto room = roomService.joinRoom(request.getRoomId(), player);
        if (room != null) {
            room.setAction("join");
            room.setTimestamp(System.currentTimeMillis());

            // 방에 있는 모든 사람에게 브로드캐스트
            messagingTemplate.convertAndSend("/topic/minigame/room/" + request.getRoomId(), room);

            // 방 목록 업데이트 브로드캐스트
            messagingTemplate.convertAndSend("/topic/minigame/rooms", room);
        }
    }

    /**
     * 방 나가기
     * Client -> /app/minigame.room.leave
     * Server -> /topic/minigame/room/{roomId} (to room)
     */
    @MessageMapping("/minigame.room.leave")
    public void leaveRoom(RoomActionRequest request) {
        log.info("방 나가기 요청: {}", request);

        MinigameRoomDto room = roomService.leaveRoom(request.getRoomId(), request.getUserId());

        if (room == null) {
            // 방이 삭제됨
            MinigameRoomDto deletedRoom = new MinigameRoomDto();
            deletedRoom.setRoomId(request.getRoomId());
            deletedRoom.setAction("delete");
            deletedRoom.setTimestamp(System.currentTimeMillis());

            messagingTemplate.convertAndSend("/topic/minigame/rooms", deletedRoom);
        } else {
            room.setAction("leave");
            room.setTimestamp(System.currentTimeMillis());

            // 방에 있는 모든 사람에게 브로드캐스트
            messagingTemplate.convertAndSend("/topic/minigame/room/" + request.getRoomId(), room);

            // 방 목록 업데이트 브로드캐스트
            messagingTemplate.convertAndSend("/topic/minigame/rooms", room);
        }
    }

    /**
     * 방 설정 변경
     * Client -> /app/minigame.room.update
     * Server -> /topic/minigame/room/{roomId} (to room)
     */
    @MessageMapping("/minigame.room.update")
    public void updateRoom(UpdateRoomRequest request) {
        log.info("방 설정 변경 요청: {}", request);

        MinigameRoomDto room = roomService.updateRoomSettings(
            request.getRoomId(),
            request.getGameName(),
            request.getMaxPlayers()
        );
        if (room != null) {
            room.setAction("update");
            room.setTimestamp(System.currentTimeMillis());

            // 방에 있는 모든 사람에게 브로드캐스트
            messagingTemplate.convertAndSend("/topic/minigame/room/" + request.getRoomId(), room);

            // 방 목록 업데이트 브로드캐스트
            messagingTemplate.convertAndSend("/topic/minigame/rooms", room);
        }
    }

    /**
     * 준비 상태 변경
     * Client -> /app/minigame.room.ready
     * Server -> /topic/minigame/room/{roomId} (to room)
     */
    @MessageMapping("/minigame.room.ready")
    public void toggleReady(RoomActionRequest request) {
        log.info("준비 상태 변경 요청: {}", request);

        MinigameRoomDto room = roomService.toggleReady(request.getRoomId(), request.getUserId());
        if (room != null) {
            room.setAction("ready");
            room.setTimestamp(System.currentTimeMillis());

            messagingTemplate.convertAndSend("/topic/minigame/room/" + request.getRoomId(), room);
        }
    }

    /**
     * 게임 시작
     * Client -> /app/minigame.room.start
     * Server -> /topic/minigame/room/{roomId} (to room)
     */
    @MessageMapping("/minigame.room.start")
    public void startGame(RoomActionRequest request) {
        log.info("게임 시작 요청: {}", request);

        MinigameRoomDto room = roomService.startGame(request.getRoomId());
        if (room != null) {
            room.setAction("start");
            room.setTimestamp(System.currentTimeMillis());

            messagingTemplate.convertAndSend("/topic/minigame/room/" + request.getRoomId(), room);
        }
    }

    /**
     * 대기방 채팅
     * Client -> /app/minigame.room.chat
     * Server -> /topic/minigame/room/{roomId}/chat (to room)
     */
    @MessageMapping("/minigame.room.chat")
    public void sendRoomChat(MinigameChatDto chatDto) {
        chatDto.setTimestamp(System.currentTimeMillis());
        messagingTemplate.convertAndSend("/topic/minigame/room/" + chatDto.getRoomId() + "/chat", chatDto);
    }
}
