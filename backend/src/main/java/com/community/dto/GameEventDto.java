package com.community.dto;

import lombok.Data;

@Data
public class GameEventDto {
    private String roomId;
    private String type; // spawnTarget, hit, scoreUpdate, gameStart, gameEnd, targetRemoved, omokMove
    private String playerId;
    private String playerName;
    private GameTargetDto target;
    private String targetId; // Added for convenience to pass just ID
    private Integer position; // For omok game (board position)
    private String payload; // optional
    private Long timestamp;
}
