package com.community.dto;

import lombok.Data;

@Data
public class CreateRoomRequest {
    private String roomName;
    private String gameName;
    private String hostId;
    private String hostName;
    private int maxPlayers;
    private boolean isLocked;
    private int hostLevel;
}
