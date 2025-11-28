package com.community.service;

import com.community.dto.PostDto;
import com.community.model.Board;
import com.community.model.Post;
import com.community.model.User;
import com.community.repository.BoardRepository;
import com.community.repository.PostRepository;
import com.community.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class PostService {

    private final PostRepository postRepository;
    private final BoardRepository boardRepository;
    private final UserRepository userRepository;

    // 게시글 생성
    @Transactional
    public PostDto.Response createPost(PostDto.CreateRequest request, Long userId) {
        Board board = boardRepository.findById(request.getBoardId())
                .orElseThrow(() -> new IllegalArgumentException("게시판을 찾을 수 없습니다."));

        User author = userRepository.findById(userId)
                .orElseThrow(() -> new IllegalArgumentException("사용자를 찾을 수 없습니다."));

        Post post = Post.builder()
                .board(board)
                .author(author)
                .title(request.getTitle())
                .content(request.getContent())
                .images(request.getImages())
                .build();

        Post savedPost = postRepository.save(post);
        return PostDto.Response.from(savedPost);
    }

    // 게시글 상세 조회
    @Transactional
    public PostDto.Response getPost(Long postId) {
        Post post = postRepository.findById(postId)
                .orElseThrow(() -> new IllegalArgumentException("게시글을 찾을 수 없습니다."));

        if (post.getIsDeleted()) {
            throw new IllegalArgumentException("삭제된 게시글입니다.");
        }

        // 조회수 증가
        post.setViewCount(post.getViewCount() + 1);
        return PostDto.Response.from(post);
    }

    // 게시판별 게시글 목록
    public Page<PostDto.ListResponse> getPostsByBoard(Long boardId, Pageable pageable) {
        return postRepository.findByBoardIdAndIsDeletedFalseOrderByCreatedAtDesc(boardId, pageable)
                .map(PostDto.ListResponse::from);
    }

    // 게시글 수정
    @Transactional
    public PostDto.Response updatePost(Long postId, PostDto.UpdateRequest request, Long userId) {
        Post post = postRepository.findById(postId)
                .orElseThrow(() -> new IllegalArgumentException("게시글을 찾을 수 없습니다."));

        if (!post.getAuthor().getId().equals(userId)) {
            throw new IllegalArgumentException("수정 권한이 없습니다.");
        }

        post.setTitle(request.getTitle());
        post.setContent(request.getContent());
        post.setImages(request.getImages());

        return PostDto.Response.from(post);
    }

    // 게시글 삭제 (소프트 삭제)
    @Transactional
    public void deletePost(Long postId, Long userId) {
        Post post = postRepository.findById(postId)
                .orElseThrow(() -> new IllegalArgumentException("게시글을 찾을 수 없습니다."));

        if (!post.getAuthor().getId().equals(userId)) {
            throw new IllegalArgumentException("삭제 권한이 없습니다.");
        }

        post.setIsDeleted(true);
    }

    // 게시글 검색
    public Page<PostDto.ListResponse> searchPosts(Long boardId, String keyword, String searchType, Pageable pageable) {
        Page<Post> posts;

        switch (searchType.toLowerCase()) {
            case "title":
                posts = postRepository.findByBoardIdAndTitleContainingAndIsDeletedFalseOrderByCreatedAtDesc(
                        boardId, keyword, pageable);
                break;
            case "content":
                posts = postRepository.findByBoardIdAndContentContainingAndIsDeletedFalseOrderByCreatedAtDesc(
                        boardId, keyword, pageable);
                break;
            case "all":
                // 제목 또는 내용에 키워드 포함
                // Repository에 추가 메서드가 필요하지만, 우선 제목 검색 사용
                posts = postRepository.findByBoardIdAndTitleContainingAndIsDeletedFalseOrderByCreatedAtDesc(
                        boardId, keyword, pageable);
                break;
            default:
                throw new IllegalArgumentException("잘못된 검색 타입입니다. (title, content, all 중 선택)");
        }

        return posts.map(PostDto.ListResponse::from);
    }
}
