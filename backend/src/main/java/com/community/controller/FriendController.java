package com.community.controller;

import com.community.dto.FriendRequestDto;
import com.community.model.Friendship;
import com.community.model.User;
import com.community.service.FriendService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/friends")
@RequiredArgsConstructor
public class FriendController {

    private final FriendService friendService;

    /**
     * 친구 요청 보내기 (닉네임으로)
     */
    @PostMapping("/request")
    public ResponseEntity<?> sendFriendRequest(
            @AuthenticationPrincipal User currentUser,
            @RequestBody Map<String, String> request
    ) {
        try {
            String targetUsername = request.get("username");
            Friendship friendship = friendService.sendFriendRequest(currentUser.getId(), targetUsername);

            Map<String, Object> response = new HashMap<>();
            response.put("message", "친구 요청을 보냈습니다.");
            response.put("friendship", friendship);
            return ResponseEntity.ok(response);
        } catch (RuntimeException e) {
            Map<String, String> error = new HashMap<>();
            error.put("message", e.getMessage());
            return ResponseEntity.badRequest().body(error);
        }
    }

    /**
     * 받은 친구 요청 목록 조회
     */
    @GetMapping("/requests/received")
    public ResponseEntity<?> getReceivedRequests(@AuthenticationPrincipal User currentUser) {
        List<FriendRequestDto> requests = friendService.getReceivedRequests(currentUser.getId());
        return ResponseEntity.ok(requests);
    }

    /**
     * 보낸 친구 요청 목록 조회
     */
    @GetMapping("/requests/sent")
    public ResponseEntity<?> getSentRequests(@AuthenticationPrincipal User currentUser) {
        List<FriendRequestDto> requests = friendService.getSentRequests(currentUser.getId());
        return ResponseEntity.ok(requests);
    }

    /**
     * 친구 요청 수락
     */
    @PostMapping("/accept/{friendshipId}")
    public ResponseEntity<?> acceptFriendRequest(
            @AuthenticationPrincipal User currentUser,
            @PathVariable Long friendshipId
    ) {
        try {
            friendService.acceptFriendRequest(currentUser.getId(), friendshipId);
            Map<String, String> response = new HashMap<>();
            response.put("message", "친구 요청을 수락했습니다.");
            return ResponseEntity.ok(response);
        } catch (RuntimeException e) {
            Map<String, String> error = new HashMap<>();
            error.put("message", e.getMessage());
            return ResponseEntity.badRequest().body(error);
        }
    }

    /**
     * 친구 요청 거절
     */
    @PostMapping("/reject/{friendshipId}")
    public ResponseEntity<?> rejectFriendRequest(
            @AuthenticationPrincipal User currentUser,
            @PathVariable Long friendshipId
    ) {
        try {
            friendService.rejectFriendRequest(currentUser.getId(), friendshipId);
            Map<String, String> response = new HashMap<>();
            response.put("message", "친구 요청을 거절했습니다.");
            return ResponseEntity.ok(response);
        } catch (RuntimeException e) {
            Map<String, String> error = new HashMap<>();
            error.put("message", e.getMessage());
            return ResponseEntity.badRequest().body(error);
        }
    }

    /**
     * 친구 목록 조회
     */
    @GetMapping
    public ResponseEntity<?> getFriends(@AuthenticationPrincipal User currentUser) {
        List<FriendRequestDto> friends = friendService.getFriends(currentUser.getId());
        return ResponseEntity.ok(friends);
    }

    /**
     * 친구 삭제
     */
    @DeleteMapping("/{friendshipId}")
    public ResponseEntity<?> removeFriend(
            @AuthenticationPrincipal User currentUser,
            @PathVariable Long friendshipId
    ) {
        try {
            friendService.removeFriend(currentUser.getId(), friendshipId);
            Map<String, String> response = new HashMap<>();
            response.put("message", "친구를 삭제했습니다.");
            return ResponseEntity.ok(response);
        } catch (RuntimeException e) {
            Map<String, String> error = new HashMap<>();
            error.put("message", e.getMessage());
            return ResponseEntity.badRequest().body(error);
        }
    }

    /**
     * 사용자 검색 (닉네임으로)
     */
    @GetMapping("/search")
    public ResponseEntity<?> searchUsers(
            @AuthenticationPrincipal User currentUser,
            @RequestParam String username
    ) {
        try {
            FriendRequestDto user = friendService.searchUserByUsername(username, currentUser.getId());
            return ResponseEntity.ok(user);
        } catch (RuntimeException e) {
            Map<String, String> error = new HashMap<>();
            error.put("message", e.getMessage());
            return ResponseEntity.badRequest().body(error);
        }
    }
}
