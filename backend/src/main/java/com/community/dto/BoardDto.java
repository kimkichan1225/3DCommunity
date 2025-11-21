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
}
