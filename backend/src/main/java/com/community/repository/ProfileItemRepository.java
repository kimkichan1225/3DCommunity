package com.community.repository;

import com.community.model.ProfileItem;
import com.community.model.enums.ItemType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface ProfileItemRepository extends JpaRepository<ProfileItem, Long> {

    // 아이템 타입별 조회
    List<ProfileItem> findByItemType(ItemType itemType);

    // 아이템 코드로 조회
    Optional<ProfileItem> findByItemCode(String itemCode);

    // 기본 아이템 조회
    List<ProfileItem> findByIsDefaultTrue();

    // 타입별 기본 아이템 조회
    List<ProfileItem> findByItemTypeAndIsDefaultTrue(ItemType itemType);

    // 표시 순서대로 정렬하여 조회
    List<ProfileItem> findAllByOrderByDisplayOrderAsc();

    // 타입별 표시 순서대로 정렬하여 조회
    List<ProfileItem> findByItemTypeOrderByDisplayOrderAsc(ItemType itemType);
}
