package com.community.model;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

/**
 * 개인 룸 엔티티
 * 각 사용자는 최대 하나의 개인 룸만 생성 가능
 */
@Entity
@Table(name = "personal_rooms")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class PersonalRoom {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "room_id", unique = true, nullable = false)
    private String roomId;

    @Column(name = "room_name", nullable = false)
    private String roomName;

    @Column(name = "host_id", unique = true, nullable = false)
    private Long hostId;

    @Column(name = "host_name")
    private String hostName;

    @Column(name = "max_members")
    @Builder.Default
    private Integer maxMembers = 10;

    @Column(name = "is_private")
    @Builder.Default
    private Boolean isPrivate = true;

    @Column(name = "gps_lng")
    private Double gpsLng;

    @Column(name = "gps_lat")
    private Double gpsLat;

    @Column(name = "is_active")
    @Builder.Default
    private Boolean isActive = true;

    @OneToMany(mappedBy = "personalRoom", cascade = CascadeType.ALL, orphanRemoval = true, fetch = FetchType.LAZY)
    @Builder.Default
    private List<RoomFurniture> furnitures = new ArrayList<>();

    @CreationTimestamp
    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at")
    private LocalDateTime updatedAt;
}
