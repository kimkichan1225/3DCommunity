package com.community.service;

import com.community.dto.LikeDto;
import com.community.model.Comment;
import com.community.model.Like;
import com.community.model.Post;
import com.community.model.User;
import com.community.repository.CommentRepository;
import com.community.repository.LikeRepository;
import com.community.repository.PostRepository;
import com.community.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Optional;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class LikeService {

    private final LikeRepository likeRepository;
    private final UserRepository userRepository;
    private final PostRepository postRepository;
    private final CommentRepository commentRepository;

    // 좋아요 토글 (있으면 취소, 없으면 추가)
    @Transactional
    public LikeDto.ToggleResponse toggleLike(LikeDto.CreateRequest request, Long userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new IllegalArgumentException("사용자를 찾을 수 없습니다."));

        // 대상 존재 여부 확인
        validateTarget(request.getTargetType(), request.getTargetId());

        // 이미 좋아요 했는지 확인
        Optional<Like> existingLike = likeRepository.findByUserAndTargetTypeAndTargetId(
                user, request.getTargetType(), request.getTargetId());

        boolean isLiked;
        if (existingLike.isPresent()) {
            // 좋아요 취소
            likeRepository.delete(existingLike.get());
            updateLikeCount(request.getTargetType(), request.getTargetId(), -1);
            isLiked = false;
        } else {
            // 좋아요 추가
            Like like = Like.builder()
                    .user(user)
                    .targetType(request.getTargetType())
                    .targetId(request.getTargetId())
                    .build();
            likeRepository.save(like);
            updateLikeCount(request.getTargetType(), request.getTargetId(), 1);
            isLiked = true;
        }

        // 현재 좋아요 수 조회
        Long likeCount = likeRepository.countByTargetTypeAndTargetId(
                request.getTargetType(), request.getTargetId());

        return LikeDto.ToggleResponse.of(isLiked, likeCount);
    }

    // 좋아요 여부 확인
    public Boolean isLiked(Like.TargetType targetType, Long targetId, Long userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new IllegalArgumentException("사용자를 찾을 수 없습니다."));

        return likeRepository.existsByUserAndTargetTypeAndTargetId(user, targetType, targetId);
    }

    // 좋아요 수 조회
    public Long getLikeCount(Like.TargetType targetType, Long targetId) {
        return likeRepository.countByTargetTypeAndTargetId(targetType, targetId);
    }

    // 대상 존재 여부 확인
    private void validateTarget(Like.TargetType targetType, Long targetId) {
        if (targetType == Like.TargetType.POST) {
            postRepository.findById(targetId)
                    .orElseThrow(() -> new IllegalArgumentException("게시글을 찾을 수 없습니다."));
        } else if (targetType == Like.TargetType.COMMENT) {
            commentRepository.findById(targetId)
                    .orElseThrow(() -> new IllegalArgumentException("댓글을 찾을 수 없습니다."));
        }
    }

    // 좋아요 수 업데이트
    private void updateLikeCount(Like.TargetType targetType, Long targetId, int delta) {
        if (targetType == Like.TargetType.POST) {
            Post post = postRepository.findById(targetId)
                    .orElseThrow(() -> new IllegalArgumentException("게시글을 찾을 수 없습니다."));
            post.setLikeCount(post.getLikeCount() + delta);
        } else if (targetType == Like.TargetType.COMMENT) {
            Comment comment = commentRepository.findById(targetId)
                    .orElseThrow(() -> new IllegalArgumentException("댓글을 찾을 수 없습니다."));
            comment.setLikeCount(comment.getLikeCount() + delta);
        }
    }
}
