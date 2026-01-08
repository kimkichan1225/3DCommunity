package com.community.model;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.LocalDateTime;

/**
 * 방 내 가구/구조물 엔티티
 * 각 가구의 위치, 회전, 스케일 정보를 저장
 */
@Entity
@Table(name = "room_furnitures")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class RoomFurniture {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "personal_room_id", nullable = false)
    private PersonalRoom personalRoom;

    @Column(name = "furniture_id", nullable = false)
    private String furnitureId;  // 클라이언트에서 사용하는 고유 ID

    @Column(name = "furniture_type", nullable = false)
    private String furnitureType;  // 가구 종류 (예: "sofa", "table", "chair" 등)

    @Column(name = "model_path")
    private String modelPath;  // 3D 모델 경로

    // 위치 (x, y, z)
    @Column(name = "pos_x")
    @Builder.Default
    private Double posX = 0.0;

    @Column(name = "pos_y")
    @Builder.Default
    private Double posY = 0.0;

    @Column(name = "pos_z")
    @Builder.Default
    private Double posZ = 0.0;

    // 회전 (x, y, z) - 오일러 각도
    @Column(name = "rot_x")
    @Builder.Default
    private Double rotX = 0.0;

    @Column(name = "rot_y")
    @Builder.Default
    private Double rotY = 0.0;

    @Column(name = "rot_z")
    @Builder.Default
    private Double rotZ = 0.0;

    // 스케일 (x, y, z)
    @Column(name = "scale_x")
    @Builder.Default
    private Double scaleX = 1.0;

    @Column(name = "scale_y")
    @Builder.Default
    private Double scaleY = 1.0;

    @Column(name = "scale_z")
    @Builder.Default
    private Double scaleZ = 1.0;

    @Column(name = "is_visible")
    @Builder.Default
    private Boolean isVisible = true;

    @Column(name = "color")
    private String color;  // 색상 (hex 코드)

    @Column(name = "custom_data", columnDefinition = "TEXT")
    private String customData;  // 추가 커스텀 데이터 (JSON 형식)

    @CreationTimestamp
    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at")
    private LocalDateTime updatedAt;
}
