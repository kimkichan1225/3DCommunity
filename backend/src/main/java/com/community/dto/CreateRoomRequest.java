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
    private String selectedProfile;
    private String selectedOutline;
    
    // GPS 위치 정보
    private Double gpsLng;
    private Double gpsLat;
}
