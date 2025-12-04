package com.community.dto;

import com.community.model.Notice;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

public class NoticeDto {

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    public static class CreateRequest {
        private String title;
        private String content;
        private Boolean isPinned;
        private Integer priority;
    }

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    public static class UpdateRequest {
        private String title;
        private String content;
        private Boolean isPinned;
        private Integer priority;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class Response {
        private Long id;
        private Long authorId;
        private String authorName;
        private String title;
        private String content;
        private Boolean isPinned;
        private Integer priority;
        private Integer viewCount;
        private LocalDateTime createdAt;
        private LocalDateTime updatedAt;

        public static Response from(Notice notice) {
            return Response.builder()
                    .id(notice.getId())
                    .authorId(notice.getAuthor().getId())
                    .authorName(notice.getAuthor().getNickname())
                    .title(notice.getTitle())
                    .content(notice.getContent())
                    .isPinned(notice.getIsPinned())
                    .priority(notice.getPriority())
                    .viewCount(notice.getViewCount())
                    .createdAt(notice.getCreatedAt())
                    .updatedAt(notice.getUpdatedAt())
                    .build();
        }
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class ListResponse {
        private Long id;
        private String authorName;
        private String title;
        private Boolean isPinned;
        private Integer priority;
        private Integer viewCount;
        private LocalDateTime createdAt;

        public static ListResponse from(Notice notice) {
            return ListResponse.builder()
                    .id(notice.getId())
                    .authorName(notice.getAuthor().getNickname())
                    .title(notice.getTitle())
                    .isPinned(notice.getIsPinned())
                    .priority(notice.getPriority())
                    .viewCount(notice.getViewCount())
                    .createdAt(notice.getCreatedAt())
                    .build();
        }
    }
}
