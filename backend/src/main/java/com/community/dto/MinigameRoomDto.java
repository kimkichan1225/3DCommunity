package com.community.dto;

import lombok.Data;
import java.util.ArrayList;
import java.util.List;

@Data
public class MinigameRoomDto {
    private String roomId;
    private String roomName;
    private String gameName;
    private String hostId;
    private String hostName;
    private int currentPlayers;
    private int maxPlayers;
    private boolean isLocked;
    private boolean isPlaying;
    private List<MinigamePlayerDto> players = new ArrayList<>();
    private List<MinigamePlayerDto> spectators = new ArrayList<>();
    private String action; // create, join, leave, update, delete
    private Long timestamp;
}
