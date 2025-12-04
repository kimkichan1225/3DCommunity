package com.community.repository;

import com.community.model.Role;
import com.community.model.User;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.Optional;

@Repository
public interface UserRepository extends JpaRepository<User, Long> {

    Optional<User> findByEmail(String email);

    Optional<User> findByUsername(String username);

    Boolean existsByEmail(String email);

    Boolean existsByUsername(String username);

    /**
     * 사용자 목록 검색 (이메일 또는 사용자명으로)
     */
    @Query("SELECT u FROM User u WHERE " +
           "(:searchTerm IS NULL OR :searchTerm = '' OR " +
           "LOWER(u.email) LIKE LOWER(CONCAT('%', :searchTerm, '%')) OR " +
           "LOWER(u.username) LIKE LOWER(CONCAT('%', :searchTerm, '%')))")
    Page<User> searchUsers(@Param("searchTerm") String searchTerm, Pageable pageable);

    /**
     * 역할별 사용자 조회
     */
    Page<User> findByRole(Role role, Pageable pageable);

    /**
     * 제재 상태별 사용자 조회
     */
    @Query("SELECT u FROM User u WHERE " +
           "(:isSuspended = false AND (u.isPermanentlySuspended = false OR u.isPermanentlySuspended IS NULL) AND (u.suspendedUntil IS NULL OR u.suspendedUntil < :now)) OR " +
           "(:isSuspended = true AND (u.isPermanentlySuspended = true OR u.suspendedUntil >= :now))")
    Page<User> findBySuspensionStatus(@Param("isSuspended") boolean isSuspended, @Param("now") LocalDateTime now, Pageable pageable);

    /**
     * 가입일 범위로 사용자 조회
     */
    Page<User> findByCreatedAtBetween(LocalDateTime startDate, LocalDateTime endDate, Pageable pageable);

    /**
     * 오늘 가입한 사용자 수
     */
    long countByCreatedAtBetween(LocalDateTime startDate, LocalDateTime endDate);

    /**
     * 복합 검색 (검색어, 역할, 제재 상태)
     */
    @Query("SELECT u FROM User u WHERE " +
           "(:searchTerm IS NULL OR :searchTerm = '' OR LOWER(u.email) LIKE LOWER(CONCAT('%', :searchTerm, '%')) OR LOWER(u.username) LIKE LOWER(CONCAT('%', :searchTerm, '%'))) AND " +
           "(:role IS NULL OR u.role = :role) AND " +
           "(:isSuspended IS NULL OR " +
           "  (:isSuspended = false AND (u.isPermanentlySuspended = false OR u.isPermanentlySuspended IS NULL) AND (u.suspendedUntil IS NULL OR u.suspendedUntil < :now)) OR " +
           "  (:isSuspended = true AND (u.isPermanentlySuspended = true OR u.suspendedUntil >= :now)))")
    Page<User> searchUsersWithFilters(
            @Param("searchTerm") String searchTerm,
            @Param("role") Role role,
            @Param("isSuspended") Boolean isSuspended,
            @Param("now") LocalDateTime now,
            Pageable pageable
    );
}
