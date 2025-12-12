package com.community.dto;

import lombok.Data;

@Data
public class JoinRoomRequest {
    private String roomId;
    private String userId;
    private String username;
    private int level;
}
