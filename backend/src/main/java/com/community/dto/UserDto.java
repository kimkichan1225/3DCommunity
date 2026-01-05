package com.community.dto;

import com.community.model.User;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class UserDto {

    private Long id;
    private String username;
    private String email;
    private String role;
    private LocalDateTime createdAt;

    // 프로필 관련 정보
    private ProfileItemDto selectedProfile;
    private ProfileItemDto selectedOutline;

    // 제재 관련 정보
    private Boolean isPermanentlySuspended;
    private LocalDateTime suspendedUntil;
    private String suspensionReason;

    // 재화 정보
    private Integer goldCoins;
    private Integer silverCoins;

    public static UserDto fromEntity(User user) {
        UserDtoBuilder builder = UserDto.builder()
                .id(user.getId())
                .username(user.getNickname()) // 닉네임 사용
                .email(user.getEmail())
                .role(user.getRole().name())
                .createdAt(user.getCreatedAt())
                .isPermanentlySuspended(user.getIsPermanentlySuspended())
                .suspendedUntil(user.getSuspendedUntil())
                .suspensionReason(user.getSuspensionReason())
                .goldCoins(user.getGoldCoins())
                .silverCoins(user.getSilverCoins());

        // 선택된 프로필/테두리 정보 추가
        if (user.getSelectedProfile() != null) {
            builder.selectedProfile(ProfileItemDto.fromEntity(user.getSelectedProfile()));
        }
        if (user.getSelectedOutline() != null) {
            builder.selectedOutline(ProfileItemDto.fromEntity(user.getSelectedOutline()));
        }

        return builder.build();
    }
}
