package com.community.dto;

import com.community.model.Message;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ChatLogDto {
    private Long messageId;
    private Long senderId;
    private String senderUsername;
    private Long receiverId;
    private String receiverUsername;
    private String messageType; // PLAZA, LOCAL_ROOM, DM
    private Long roomId;
    private String content;
    private LocalDateTime createdAt;
    private Boolean isDeleted;

    public static ChatLogDto fromEntity(Message message) {
        return ChatLogDto.builder()
                .messageId(message.getId())
                .senderId(message.getSender().getId())
                .senderUsername(message.getSender().getNickname())
                .receiverId(message.getReceiver() != null ? message.getReceiver().getId() : null)
                .receiverUsername(message.getReceiver() != null ? message.getReceiver().getNickname() : null)
                .messageType(message.getMessageType().name())
                .roomId(message.getRoomId())
                .content(message.getContent())
                .createdAt(message.getCreatedAt())
                .isDeleted(message.getIsDeleted())
                .build();
    }
}
