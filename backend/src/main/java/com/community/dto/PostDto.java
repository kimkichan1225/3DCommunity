package com.community.dto;

import com.community.model.Post;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

public class PostDto {

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    public static class CreateRequest {
        private Long boardId;
        private String title;
        private String content;
        private String images;
    }

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    public static class UpdateRequest {
        private String title;
        private String content;
        private String images;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class Response {
        private Long id;
        private Long boardId;
        private String boardName;
        private Long authorId;
        private String authorName;
        private String title;
        private String content;
        private String images;
        private Integer viewCount;
        private Integer likeCount;
        private Integer commentCount;
        private LocalDateTime createdAt;
        private LocalDateTime updatedAt;

        public static Response from(Post post) {
            return Response.builder()
                    .id(post.getId())
                    .boardId(post.getBoard().getId())
                    .boardName(post.getBoard().getName())
                    .authorId(post.getAuthor().getId())
                    .authorName(post.getAuthor().getNickname())
                    .title(post.getTitle())
                    .content(post.getContent())
                    .images(post.getImages())
                    .viewCount(post.getViewCount())
                    .likeCount(post.getLikeCount())
                    .commentCount(post.getComments() != null ?
                        (int) post.getComments().stream()
                            .filter(c -> !c.getIsDeleted())
                            .count() : 0)
                    .createdAt(post.getCreatedAt())
                    .updatedAt(post.getUpdatedAt())
                    .build();
        }
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class ListResponse {
        private Long id;
        private String boardName;
        private String authorName;
        private String title;
        private Integer viewCount;
        private Integer likeCount;
        private Integer commentCount;
        private LocalDateTime createdAt;

        public static ListResponse from(Post post) {
            return ListResponse.builder()
                    .id(post.getId())
                    .boardName(post.getBoard().getName())
                    .authorName(post.getAuthor().getNickname())
                    .title(post.getTitle())
                    .viewCount(post.getViewCount())
                    .likeCount(post.getLikeCount())
                    .commentCount(post.getComments() != null ?
                        (int) post.getComments().stream()
                            .filter(c -> !c.getIsDeleted())
                            .count() : 0)
                    .createdAt(post.getCreatedAt())
                    .build();
        }
    }
}
