package com.community.repository;

import com.community.model.Comment;
import com.community.model.Post;
import com.community.model.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface CommentRepository extends JpaRepository<Comment, Long> {

    // 게시글의 최상위 댓글만 조회 (대댓글 제외)
    List<Comment> findByPostAndParentCommentIsNullAndIsDeletedFalseOrderByCreatedAtAsc(Post post);

    // 게시글 ID로 최상위 댓글 조회
    List<Comment> findByPostIdAndParentCommentIsNullAndIsDeletedFalseOrderByCreatedAtAsc(Long postId);

    // 특정 댓글의 대댓글 조회
    List<Comment> findByParentCommentAndIsDeletedFalseOrderByCreatedAtAsc(Comment parentComment);

    // 작성자별 댓글 조회
    List<Comment> findByAuthorAndIsDeletedFalseOrderByCreatedAtDesc(User author);

    // 게시글의 댓글 수
    Long countByPostAndIsDeletedFalse(Post post);
}
