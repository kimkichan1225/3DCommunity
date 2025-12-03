package com.community.service;

import com.community.dto.DashboardStatsDto;
import com.community.model.PostType;
import com.community.repository.PostRepository;
import com.community.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.time.LocalDateTime;

@Service
@RequiredArgsConstructor
public class AdminService {

    private final UserRepository userRepository;
    private final PostRepository postRepository;

    /**
     * 대시보드 통계 데이터 조회 (타입별 통계 포함)
     */
    public DashboardStatsDto getDashboardStats() {
        long totalUsers = userRepository.count();

        // 오늘 가입한 사용자 (00:00:00 ~ 23:59:59)
        LocalDateTime todayStart = LocalDate.now().atStartOfDay();
        LocalDateTime todayEnd = todayStart.plusDays(1);

        // TODO: 실제 구현 시 커스텀 쿼리 필요
        long todayNewUsers = 0; // userRepository.countByCreatedAtBetween(todayStart, todayEnd);

        long totalPosts = postRepository.count();

        // TODO: Comment Repository에서 조회
        long totalComments = 0;

        // 타입별 게시글 수 계산 (모든 게시판 전체)
        long generalPosts = postRepository.findAll().stream()
                .filter(post -> !post.getIsDeleted() && post.getPostType() == PostType.GENERAL)
                .count();
        long questionPosts = postRepository.findAll().stream()
                .filter(post -> !post.getIsDeleted() && post.getPostType() == PostType.QUESTION)
                .count();
        long imagePosts = postRepository.findAll().stream()
                .filter(post -> !post.getIsDeleted() && post.getPostType() == PostType.IMAGE)
                .count();
        long videoPosts = postRepository.findAll().stream()
                .filter(post -> !post.getIsDeleted() && post.getPostType() == PostType.VIDEO)
                .count();

        return DashboardStatsDto.builder()
                .totalUsers(totalUsers)
                .todayNewUsers(todayNewUsers)
                .totalPosts(totalPosts)
                .totalComments(totalComments)
                .generalPosts(generalPosts)
                .questionPosts(questionPosts)
                .imagePosts(imagePosts)
                .videoPosts(videoPosts)
                .build();
    }
}
