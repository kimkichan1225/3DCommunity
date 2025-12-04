package com.community.dto;

import com.community.model.Message;
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
public class MessageDto {
    private Long id;
    private Long senderId;
    private String senderUsername;
    private Long receiverId;
    private String receiverUsername;
    private String content;
    private String messageType; // DM, PLAZA, LOCAL_ROOM
    private LocalDateTime createdAt;
    private boolean isDeleted;

    // 채팅방 목록용 추가 필드
    private Long friendId; // 대화 상대방 ID
    private String friendUsername; // 대화 상대방 닉네임
    private String lastMessage; // 마지막 메시지
    private LocalDateTime lastMessageTime; // 마지막 메시지 시간
    private int unreadCount; // 안 읽은 메시지 수
    private boolean friendIsOnline; // 상대방 온라인 여부
    private Integer friendProfile; // 상대방 프로필
    private Integer friendOutline; // 상대방 테두리

    public static MessageDto fromEntity(Message message) {
        return MessageDto.builder()
                .id(message.getId())
                .senderId(message.getSender().getId())
                .senderUsername(message.getSender().getNickname())
                .receiverId(message.getReceiver() != null ? message.getReceiver().getId() : null)
                .receiverUsername(message.getReceiver() != null ? message.getReceiver().getNickname() : null)
                .content(message.getContent())
                .messageType(message.getMessageType().name())
                .createdAt(message.getCreatedAt())
                .isDeleted(message.getIsDeleted())
                .build();
    }

    public static MessageDto forConversation(User friend, Message lastMessage, int unreadCount, boolean isOnline) {
        return MessageDto.builder()
                .friendId(friend.getId())
                .friendUsername(friend.getNickname())
                .lastMessage(lastMessage != null ? lastMessage.getContent() : "")
                .lastMessageTime(lastMessage != null ? lastMessage.getCreatedAt() : null)
                .unreadCount(unreadCount)
                .friendIsOnline(isOnline)
                .friendProfile(friend.getSelectedProfile() != null ? friend.getSelectedProfile().getId().intValue() : null)
                .friendOutline(friend.getSelectedOutline() != null ? friend.getSelectedOutline().getId().intValue() : null)
                .build();
    }
}
