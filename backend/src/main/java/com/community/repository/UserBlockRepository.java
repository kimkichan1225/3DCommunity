package com.community.repository;

import com.community.model.UserBlock;
import com.community.model.UserBlock.BlockType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface UserBlockRepository extends JpaRepository<UserBlock, Long> {

    // 특정 사용자가 차단/뮤트한 목록 조회
    List<UserBlock> findByBlockerIdAndBlockType(Long blockerId, BlockType blockType);

    // 특정 사용자를 차단/뮤트했는지 확인
    @Query("SELECT ub FROM UserBlock ub WHERE ub.blocker.id = :blockerId AND ub.blocked.id = :blockedId AND ub.blockType = :blockType")
    Optional<UserBlock> findByBlockerAndBlockedAndType(@Param("blockerId") Long blockerId, @Param("blockedId") Long blockedId, @Param("blockType") BlockType blockType);

    // 차단/뮤트 여부 확인
    boolean existsByBlockerIdAndBlockedIdAndBlockType(Long blockerId, Long blockedId, BlockType blockType);

    // 사용자가 차단한 모든 사용자 ID 목록
    @Query("SELECT ub.blocked.id FROM UserBlock ub WHERE ub.blocker.id = :blockerId AND ub.blockType = 'BLOCK'")
    List<Long> findBlockedUserIds(@Param("blockerId") Long blockerId);

    // 사용자가 뮤트한 모든 사용자 ID 목록
    @Query("SELECT ub.blocked.id FROM UserBlock ub WHERE ub.blocker.id = :blockerId AND ub.blockType = 'MUTE'")
    List<Long> findMutedUserIds(@Param("blockerId") Long blockerId);
}
