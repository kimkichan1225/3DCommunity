package com.community.dto;

import com.community.model.Like;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

public class LikeDto {

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    public static class CreateRequest {
        private Like.TargetType targetType; // POST or COMMENT
        private Long targetId; // 게시글 ID 또는 댓글 ID
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class Response {
        private Long id;
        private Long userId;
        private String userName;
        private Like.TargetType targetType;
        private Long targetId;
        private LocalDateTime createdAt;

        public static Response from(Like like) {
            return Response.builder()
                    .id(like.getId())
                    .userId(like.getUser().getId())
                    .userName(like.getUser().getNickname())
                    .targetType(like.getTargetType())
                    .targetId(like.getTargetId())
                    .createdAt(like.getCreatedAt())
                    .build();
        }
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class ToggleResponse {
        private Boolean isLiked; // true: 좋아요 추가됨, false: 좋아요 취소됨
        private Long likeCount; // 현재 좋아요 수

        public static ToggleResponse of(Boolean isLiked, Long likeCount) {
            return ToggleResponse.builder()
                    .isLiked(isLiked)
                    .likeCount(likeCount)
                    .build();
        }
    }
}
