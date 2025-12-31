package com.community.dto;

import lombok.Data;

@Data
public class GameTargetDto {
    private String id;
    private double x; // normalized 0..1
    private double y; // normalized 0..1
    private double size; // normalized (0..1) representing radius
    private long createdAt; // epoch millis
    private long duration; // millis
}
