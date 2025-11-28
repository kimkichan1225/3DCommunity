package com.community.service;

import com.community.dto.CommentDto;
import com.community.model.Comment;
import com.community.model.Post;
import com.community.model.User;
import com.community.repository.CommentRepository;
import com.community.repository.PostRepository;
import com.community.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class CommentService {

    private final CommentRepository commentRepository;
    private final PostRepository postRepository;
    private final UserRepository userRepository;

    // 댓글 작성
    @Transactional
    public CommentDto.Response createComment(CommentDto.CreateRequest request, Long userId) {
        Post post = postRepository.findById(request.getPostId())
                .orElseThrow(() -> new IllegalArgumentException("게시글을 찾을 수 없습니다."));

        User author = userRepository.findById(userId)
                .orElseThrow(() -> new IllegalArgumentException("사용자를 찾을 수 없습니다."));

        Comment parentComment = null;
        if (request.getParentCommentId() != null) {
            parentComment = commentRepository.findById(request.getParentCommentId())
                    .orElseThrow(() -> new IllegalArgumentException("부모 댓글을 찾을 수 없습니다."));
        }

        Comment comment = Comment.builder()
                .post(post)
                .author(author)
                .parentComment(parentComment)
                .content(request.getContent())
                .build();

        Comment savedComment = commentRepository.save(comment);
        return CommentDto.Response.fromWithoutReplies(savedComment);
    }

    // 게시글의 댓글 목록 조회 (최상위 댓글만, 대댓글은 각 댓글에 포함)
    public List<CommentDto.Response> getCommentsByPost(Long postId) {
        return commentRepository.findByPostIdAndParentCommentIsNullAndIsDeletedFalseOrderByCreatedAtAsc(postId)
                .stream()
                .map(CommentDto.Response::from)
                .collect(Collectors.toList());
    }

    // 댓글 상세 조회
    public CommentDto.Response getComment(Long commentId) {
        Comment comment = commentRepository.findById(commentId)
                .orElseThrow(() -> new IllegalArgumentException("댓글을 찾을 수 없습니다."));

        return CommentDto.Response.from(comment);
    }

    // 댓글 수정
    @Transactional
    public CommentDto.Response updateComment(Long commentId, CommentDto.UpdateRequest request, Long userId) {
        Comment comment = commentRepository.findById(commentId)
                .orElseThrow(() -> new IllegalArgumentException("댓글을 찾을 수 없습니다."));

        if (!comment.getAuthor().getId().equals(userId)) {
            throw new IllegalArgumentException("수정 권한이 없습니다.");
        }

        if (comment.getIsDeleted()) {
            throw new IllegalArgumentException("삭제된 댓글은 수정할 수 없습니다.");
        }

        comment.setContent(request.getContent());
        return CommentDto.Response.fromWithoutReplies(comment);
    }

    // 댓글 삭제 (소프트 삭제)
    @Transactional
    public void deleteComment(Long commentId, Long userId) {
        Comment comment = commentRepository.findById(commentId)
                .orElseThrow(() -> new IllegalArgumentException("댓글을 찾을 수 없습니다."));

        if (!comment.getAuthor().getId().equals(userId)) {
            throw new IllegalArgumentException("삭제 권한이 없습니다.");
        }

        comment.setIsDeleted(true);
    }

    // 게시글의 댓글 수 조회
    public Long getCommentCount(Long postId) {
        Post post = postRepository.findById(postId)
                .orElseThrow(() -> new IllegalArgumentException("게시글을 찾을 수 없습니다."));

        return commentRepository.countByPostAndIsDeletedFalse(post);
    }
}
