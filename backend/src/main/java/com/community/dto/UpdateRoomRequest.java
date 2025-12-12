package com.community.dto;

import lombok.Data;

@Data
public class UpdateRoomRequest {
    private String roomId;
    private String gameName;
    private int maxPlayers;
}
