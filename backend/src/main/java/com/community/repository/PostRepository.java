package com.community.repository;

import com.community.model.Post;
import com.community.model.PostType;
import com.community.model.Board;
import com.community.model.User;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface PostRepository extends JpaRepository<Post, Long> {

    // 게시판별 게시글 목록 (페이징, 삭제되지 않은 것만)
    Page<Post> findByBoardAndIsDeletedFalseOrderByCreatedAtDesc(Board board, Pageable pageable);

    // 게시판 ID로 게시글 목록
    Page<Post> findByBoardIdAndIsDeletedFalseOrderByCreatedAtDesc(Long boardId, Pageable pageable);

    // 작성자별 게시글 목록
    List<Post> findByAuthorAndIsDeletedFalseOrderByCreatedAtDesc(User author);

    // 제목 검색
    Page<Post> findByBoardIdAndTitleContainingAndIsDeletedFalseOrderByCreatedAtDesc(
            Long boardId, String keyword, Pageable pageable);

    // 내용 검색
    Page<Post> findByBoardIdAndContentContainingAndIsDeletedFalseOrderByCreatedAtDesc(
            Long boardId, String keyword, Pageable pageable);

    // 타입별 게시글 목록
    Page<Post> findByBoardIdAndPostTypeAndIsDeletedFalseOrderByCreatedAtDesc(
            Long boardId, PostType postType, Pageable pageable);

    // 타입별 게시글 수 (관리자용)
    long countByBoardIdAndPostTypeAndIsDeletedFalse(Long boardId, PostType postType);
}
