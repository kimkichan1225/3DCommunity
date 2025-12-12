package com.community.dto;

import lombok.Data;

@Data
public class GameInviteDto {
    private String inviterId;
    private String inviterUsername;
    private String targetUserId;
    private String targetUsername;
    private String roomId;
    private String gameName;
    private Long timestamp;
}
