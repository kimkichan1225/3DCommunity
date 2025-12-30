package com.community.dto;

import com.community.model.enums.UnlockConditionType;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class UnlockConditionDto {

    private UnlockConditionType type;
    private String name;
    private String description;

    // 모든 조건 타입 정보를 반환하는 헬퍼 메서드
    public static UnlockConditionDto[] getAllConditionTypes() {
        return new UnlockConditionDto[]{
                new UnlockConditionDto(UnlockConditionType.NONE, "조건 없음", "기본 제공 아이템"),
                new UnlockConditionDto(UnlockConditionType.LEVEL, "레벨 달성", "특정 레벨 달성 시 해금"),
                new UnlockConditionDto(UnlockConditionType.POST_COUNT, "게시글 수", "특정 개수의 게시글 작성 시 해금"),
                new UnlockConditionDto(UnlockConditionType.COMMENT_COUNT, "댓글 수", "특정 개수의 댓글 작성 시 해금"),
                new UnlockConditionDto(UnlockConditionType.FRIEND_COUNT, "친구 수", "특정 수의 친구 보유 시 해금"),
                new UnlockConditionDto(UnlockConditionType.LOGIN_DAYS, "연속 로그인", "연속 로그인 일수 달성 시 해금"),
                new UnlockConditionDto(UnlockConditionType.ACHIEVEMENT, "업적 달성", "특정 업적 달성 시 해금"),
                new UnlockConditionDto(UnlockConditionType.AVATAR_PURCHASE, "아바타 구매", "아바타 구매 시 자동 해금"),
                new UnlockConditionDto(UnlockConditionType.SHOP_PURCHASE, "상점 구매", "상점 구매 시 자동 해금"),
                new UnlockConditionDto(UnlockConditionType.CUSTOM, "커스텀 조건", "관리자 정의 조건")
        };
    }
}
