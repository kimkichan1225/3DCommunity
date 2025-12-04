package com.community.dto;

import com.community.model.Friendship;
import com.community.model.User;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class FriendRequestDto {
    private Long friendshipId;
    private Long userId;
    private String username;
    private String email;
    private String status; // PENDING, ACCEPTED, REJECTED
    private LocalDateTime createdAt;
    private boolean isOnline; // 온라인 여부
    private Integer selectedProfile; // 프로필 아이템 ID
    private Integer selectedOutline; // 테두리 아이템 ID

    public static FriendRequestDto fromFriendship(Friendship friendship, Long currentUserId, boolean isOnline) {
        // currentUserId와 반대편 사용자 정보를 반환
        User friend = friendship.getRequester().getId().equals(currentUserId)
                ? friendship.getAddressee()
                : friendship.getRequester();

        return FriendRequestDto.builder()
                .friendshipId(friendship.getId())
                .userId(friend.getId())
                .username(friend.getNickname())
                .email(friend.getEmail())
                .status(friendship.getStatus().name())
                .createdAt(friendship.getCreatedAt())
                .isOnline(isOnline)
                .selectedProfile(friend.getSelectedProfile() != null ? friend.getSelectedProfile().getId().intValue() : null)
                .selectedOutline(friend.getSelectedOutline() != null ? friend.getSelectedOutline().getId().intValue() : null)
                .build();
    }

    public static FriendRequestDto fromUser(User user, boolean isOnline) {
        return FriendRequestDto.builder()
                .userId(user.getId())
                .username(user.getNickname())
                .email(user.getEmail())
                .isOnline(isOnline)
                .selectedProfile(user.getSelectedProfile() != null ? user.getSelectedProfile().getId().intValue() : null)
                .selectedOutline(user.getSelectedOutline() != null ? user.getSelectedOutline().getId().intValue() : null)
                .build();
    }
}
