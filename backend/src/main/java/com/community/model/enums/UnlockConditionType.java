package com.community.model.enums;

public enum UnlockConditionType {
    NONE,           // 기본 제공 (조건 없음)
    LEVEL,          // 레벨 달성
    POST_COUNT,     // 게시글 수
    COMMENT_COUNT,  // 댓글 수
    FRIEND_COUNT,   // 친구 수
    LOGIN_DAYS,     // 연속 로그인 일수
    ACHIEVEMENT,    // 특정 업적 달성
    CUSTOM          // 커스텀 조건 (향후 확장)
}
