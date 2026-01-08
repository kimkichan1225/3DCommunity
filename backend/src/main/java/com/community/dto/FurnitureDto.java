package com.community.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * 가구 정보 DTO
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class FurnitureDto {
    private Long id;
    private String furnitureId;      // 클라이언트 고유 ID
    private String furnitureType;    // 가구 종류
    private String modelPath;        // 3D 모델 경로
    
    // 위치
    private Double posX;
    private Double posY;
    private Double posZ;
    
    // 회전
    private Double rotX;
    private Double rotY;
    private Double rotZ;
    
    // 스케일
    private Double scaleX;
    private Double scaleY;
    private Double scaleZ;
    
    private Boolean isVisible;
    private String color;
    private String customData;
}
