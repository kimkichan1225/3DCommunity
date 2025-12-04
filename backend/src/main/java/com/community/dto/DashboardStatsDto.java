package com.community.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class DashboardStatsDto {

    // 사용자 통계
    private long totalUsers;
    private long todayNewUsers;

    // 게시판 통계
    private long totalPosts;
    private long totalComments;

    // 타입별 게시글 통계
    private long generalPosts;   // 일반 게시글
    private long questionPosts;  // 질문 게시글
    private long imagePosts;     // 짤 게시글
    private long videoPosts;     // 영상 게시글
}
