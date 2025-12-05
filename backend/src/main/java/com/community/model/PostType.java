package com.community.model;

/**
 * 게시글 타입 Enum
 * GENERAL: 일반 게시글 (표시 없음)
 * QUESTION: 질문 게시글
 * IMAGE: 짤 게시글
 * VIDEO: 영상 게시글
 */
public enum PostType {
    GENERAL,    // 일반 (기본값, 표시 없음)
    QUESTION,   // 질문
    IMAGE,      // 짤
    VIDEO       // 영상
}
