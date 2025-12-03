package com.community.dto;

import com.community.model.Board;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

public class BoardDto {

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    public static class CreateRequest {
        private String name;
        private String description;
        private String category; // FREE, STRATEGY, SUGGESTION
        private Integer orderIndex;
    }

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    public static class UpdateRequest {
        private String name;
        private String description;
        private String category;
        private Boolean isActive;
        private Integer orderIndex;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class Response {
        private Long id;
        private String name;
        private String description;
        private String category;
        private LocalDateTime createdAt;

        public static Response from(Board board) {
            return Response.builder()
                    .id(board.getId())
                    .name(board.getName())
                    .description(board.getDescription())
                    .category(board.getCategory() != null ? board.getCategory().name() : null)
                    .createdAt(board.getCreatedAt())
                    .build();
        }
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class AdminResponse {
        private Long id;
        private String name;
        private String description;
        private String category;
        private Boolean isActive;
        private Integer orderIndex;
        private Long postCount;
        private Long generalCount;   // 일반 게시글 수
        private Long questionCount;  // 질문 게시글 수
        private Long imageCount;     // 짤 게시글 수
        private Long videoCount;     // 영상 게시글 수
        private LocalDateTime createdAt;

        public static AdminResponse from(Board board) {
            return AdminResponse.builder()
                    .id(board.getId())
                    .name(board.getName())
                    .description(board.getDescription())
                    .category(board.getCategory() != null ? board.getCategory().name() : null)
                    .isActive(board.getIsActive())
                    .orderIndex(board.getOrderIndex())
                    .postCount(board.getPostCount())
                    .createdAt(board.getCreatedAt())
                    .build();
        }
    }
}
