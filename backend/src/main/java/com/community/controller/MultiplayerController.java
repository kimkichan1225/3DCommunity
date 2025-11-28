package com.community.controller;

import com.community.dto.ChatMessageDto;
import com.community.dto.PlayerJoinDto;
import com.community.dto.PlayerPositionDto;
import org.springframework.messaging.handler.annotation.MessageMapping;
import org.springframework.messaging.handler.annotation.SendTo;
import org.springframework.messaging.simp.SimpMessageHeaderAccessor;
import org.springframework.stereotype.Controller;

@Controller
public class MultiplayerController {

    /**
     * 플레이어 입장
     * Client -> /app/player.join
     * Server -> /topic/players (broadcast to all)
     */
    @MessageMapping("/player.join")
    @SendTo("/topic/players")
    public PlayerJoinDto playerJoin(PlayerJoinDto joinDto, SimpMessageHeaderAccessor headerAccessor) {
        // Add username in websocket session
        headerAccessor.getSessionAttributes().put("username", joinDto.getUsername());
        headerAccessor.getSessionAttributes().put("userId", joinDto.getUserId());

        joinDto.setAction("join");
        joinDto.setTimestamp(System.currentTimeMillis());

        return joinDto;
    }

    /**
     * 플레이어 위치 업데이트
     * Client -> /app/player.position
     * Server -> /topic/positions (broadcast to all)
     */
    @MessageMapping("/player.position")
    @SendTo("/topic/positions")
    public PlayerPositionDto updatePosition(PlayerPositionDto positionDto) {
        positionDto.setTimestamp(System.currentTimeMillis());
        return positionDto;
    }

    /**
     * 전체 채팅 메시지
     * Client -> /app/chat.message
     * Server -> /topic/chat (broadcast to all)
     */
    @MessageMapping("/chat.message")
    @SendTo("/topic/chat")
    public ChatMessageDto sendChatMessage(ChatMessageDto chatDto) {
        chatDto.setTimestamp(System.currentTimeMillis());
        return chatDto;
    }
}
