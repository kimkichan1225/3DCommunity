package com.community.dto;

import com.community.model.Comment;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;

public class CommentDto {

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    public static class CreateRequest {
        private Long postId;
        private Long parentCommentId; // null이면 최상위 댓글, 값이 있으면 대댓글
        private String content;
    }

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    public static class UpdateRequest {
        private String content;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class Response {
        private Long id;
        private Long postId;
        private Long authorId;
        private String authorName;
        private Long parentCommentId;
        private String content;
        private Integer likeCount;
        private List<Response> replies; // 대댓글 목록
        private Boolean isDeleted;
        private LocalDateTime createdAt;
        private LocalDateTime updatedAt;

        public static Response from(Comment comment) {
            return Response.builder()
                    .id(comment.getId())
                    .postId(comment.getPost().getId())
                    .authorId(comment.getAuthor().getId())
                    .authorName(comment.getAuthor().getNickname())
                    .parentCommentId(comment.getParentComment() != null ?
                        comment.getParentComment().getId() : null)
                    .content(comment.getIsDeleted() ? "삭제된 댓글입니다." : comment.getContent())
                    .likeCount(comment.getLikeCount())
                    .replies(comment.getReplies().stream()
                        .filter(reply -> !reply.getIsDeleted())
                        .map(Response::from)
                        .collect(Collectors.toList()))
                    .isDeleted(comment.getIsDeleted())
                    .createdAt(comment.getCreatedAt())
                    .updatedAt(comment.getUpdatedAt())
                    .build();
        }

        // 대댓글 포함 없이 변환 (무한 재귀 방지)
        public static Response fromWithoutReplies(Comment comment) {
            return Response.builder()
                    .id(comment.getId())
                    .postId(comment.getPost().getId())
                    .authorId(comment.getAuthor().getId())
                    .authorName(comment.getAuthor().getNickname())
                    .parentCommentId(comment.getParentComment() != null ?
                        comment.getParentComment().getId() : null)
                    .content(comment.getIsDeleted() ? "삭제된 댓글입니다." : comment.getContent())
                    .likeCount(comment.getLikeCount())
                    .replies(null)
                    .isDeleted(comment.getIsDeleted())
                    .createdAt(comment.getCreatedAt())
                    .updatedAt(comment.getUpdatedAt())
                    .build();
        }
    }
}
