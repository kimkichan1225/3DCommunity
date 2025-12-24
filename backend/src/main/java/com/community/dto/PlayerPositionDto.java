package com.community.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class PlayerPositionDto {
    private String userId;        // 플레이어 ID
    private String username;      // 플레이어 이름
    private Double x;             // X 좌표
    private Double y;             // Y 좌표
    private Double z;             // Z 좌표
    private Double rotationY;     // Y축 회전 (캐릭터가 바라보는 방향)
    private String animation;     // 현재 애니메이션 상태 (idle, walk, run)
    private String modelPath;     // 캐릭터 모델 경로
    private Long timestamp;       // 타임스탬프
}
