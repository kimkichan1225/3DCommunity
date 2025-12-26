package com.community.dto;

import lombok.Data;

@Data
public class GameEventDto {
    private String roomId;
    private String type; // spawnTarget, hit, scoreUpdate, gameStart, gameEnd, targetRemoved
    private String playerId;
    private String playerName;
    private GameTargetDto target;
    private String payload; // optional
    private Long timestamp;
}
