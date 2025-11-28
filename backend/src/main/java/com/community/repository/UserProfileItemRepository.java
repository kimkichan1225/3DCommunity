package com.community.repository;

import com.community.model.ProfileItem;
import com.community.model.User;
import com.community.model.UserProfileItem;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface UserProfileItemRepository extends JpaRepository<UserProfileItem, Long> {

    // 특정 사용자의 모든 보유 아이템 조회
    List<UserProfileItem> findByUser(User user);

    // 특정 사용자의 보유 아이템 조회 (ID로)
    List<UserProfileItem> findByUserId(Long userId);

    // 사용자가 특정 아이템을 보유하고 있는지 확인
    Optional<UserProfileItem> findByUserAndProfileItem(User user, ProfileItem profileItem);

    // 사용자가 특정 아이템을 보유하고 있는지 확인 (ID로)
    boolean existsByUserIdAndProfileItemId(Long userId, Long profileItemId);

    // 특정 아이템을 보유한 사용자 수 조회
    long countByProfileItem(ProfileItem profileItem);

    // 사용자별 보유 아이템 개수
    @Query("SELECT COUNT(upi) FROM UserProfileItem upi WHERE upi.user.id = :userId")
    long countByUserId(@Param("userId") Long userId);
}
