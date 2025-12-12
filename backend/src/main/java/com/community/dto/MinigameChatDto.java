package com.community.dto;

import lombok.Data;

@Data
public class MinigameChatDto {
    private String roomId;
    private String userId;
    private String username;
    private String message;
    private Long timestamp;
}
