package com.community.dto;

import lombok.Data;

@Data
public class MinigamePlayerDto {
    private String userId;
    private String username;
    private int level;
    private boolean isHost;
    private boolean isReady;
    private String selectedProfile;
    private String selectedOutline;
}
