package com.community.dto;

import com.community.model.ChatRoom;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ChatRoomDto {
    private Long id;
    private String type;
    private String title;
    private String lastMessage;
    private LocalDateTime updatedAt;
    private Integer unreadCount;

    public static ChatRoomDto fromEntity(ChatRoom room, Integer unreadCount) {
        return ChatRoomDto.builder()
                .id(room.getId())
                .type(room.getType().name())
                .title(room.getTitle())
                .lastMessage(room.getLastMessage())
                .updatedAt(room.getUpdatedAt())
                .unreadCount(unreadCount != null ? unreadCount : 0)
                .build();
    }
}
