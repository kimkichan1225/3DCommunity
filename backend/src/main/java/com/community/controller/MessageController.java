package com.community.controller;

import com.community.dto.MessageDto;
import com.community.model.User;
import com.community.service.MessageService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/messages")
@RequiredArgsConstructor
public class MessageController {

    private final MessageService messageService;

    /**
     * DM 대화 목록 조회 (채팅방 목록)
     */
    @GetMapping("/conversations")
    public ResponseEntity<?> getConversations(@AuthenticationPrincipal User currentUser) {
        List<MessageDto> conversations = messageService.getConversations(currentUser.getId());
        return ResponseEntity.ok(conversations);
    }

    /**
     * 특정 사용자와의 DM 내역 조회
     */
    @GetMapping("/dm/{friendId}")
    public ResponseEntity<?> getDMHistory(
            @AuthenticationPrincipal User currentUser,
            @PathVariable Long friendId,
            @RequestParam(defaultValue = "50") int limit
    ) {
        List<MessageDto> messages = messageService.getDMHistory(currentUser.getId(), friendId, limit);
        return ResponseEntity.ok(messages);
    }

    /**
     * DM 전송
     */
    @PostMapping("/dm")
    public ResponseEntity<?> sendDM(
            @AuthenticationPrincipal User currentUser,
            @RequestBody Map<String, Object> request
    ) {
        try {
            Long receiverId = Long.valueOf(request.get("receiverId").toString());
            String content = request.get("content").toString();

            MessageDto message = messageService.sendDM(currentUser.getId(), receiverId, content);

            Map<String, Object> response = new HashMap<>();
            response.put("message", "메시지를 전송했습니다.");
            response.put("data", message);
            return ResponseEntity.ok(response);
        } catch (RuntimeException e) {
            Map<String, String> error = new HashMap<>();
            error.put("message", e.getMessage());
            return ResponseEntity.badRequest().body(error);
        }
    }

    /**
     * 안 읽은 DM 개수 조회
     */
    @GetMapping("/unread-count")
    public ResponseEntity<?> getUnreadCount(@AuthenticationPrincipal User currentUser) {
        // TODO: 읽음 처리 기능 구현 후 실제 개수 반환
        Map<String, Integer> response = new HashMap<>();
        response.put("count", 0);
        return ResponseEntity.ok(response);
    }

    /**
     * 특정 친구와의 메시지 읽음 처리
     */
    @PostMapping("/mark-read/{friendId}")
    public ResponseEntity<?> markMessagesAsRead(
            @AuthenticationPrincipal User currentUser,
            @PathVariable Long friendId
    ) {
        try {
            messageService.markMessagesAsRead(currentUser.getId(), friendId);
            Map<String, String> response = new HashMap<>();
            response.put("message", "메시지를 읽음 처리했습니다.");
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            Map<String, String> error = new HashMap<>();
            error.put("message", "읽음 처리 실패: " + e.getMessage());
            return ResponseEntity.badRequest().body(error);
        }
    }
}
