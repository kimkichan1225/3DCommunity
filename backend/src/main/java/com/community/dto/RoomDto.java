package com.community.dto;

import lombok.Data;

@Data
public class RoomDto {
    private String action;          // "create" 또는 "delete"
    private String roomId;          // 방 ID
    private String roomName;        // 방 이름
    private String hostId;          // 호스트 ID
    private String hostName;        // 호스트 이름
    private Integer maxMembers;     // 최대 인원
    private Boolean isPrivate;      // 비공개 여부
    private Double gpsLng;          // GPS 경도
    private Double gpsLat;          // GPS 위도
    private String gameName;        // 게임 이름
    private Long timestamp;         // 타임스탬프
    private Integer members;        // 현재 인원 (선택사항)
}
