package com.community.repository;

import com.community.model.Like;
import com.community.model.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface LikeRepository extends JpaRepository<Like, Long> {

    // 특정 사용자가 특정 대상에 좋아요 했는지 확인
    Optional<Like> findByUserAndTargetTypeAndTargetId(
            User user, Like.TargetType targetType, Long targetId);

    // 좋아요 존재 여부 확인
    Boolean existsByUserAndTargetTypeAndTargetId(
            User user, Like.TargetType targetType, Long targetId);

    // 특정 대상의 좋아요 수
    Long countByTargetTypeAndTargetId(Like.TargetType targetType, Long targetId);

    // 좋아요 삭제
    void deleteByUserAndTargetTypeAndTargetId(
            User user, Like.TargetType targetType, Long targetId);
}
