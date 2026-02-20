package com.popups.pupoo.notice.domain.enums;

/**
 * 공지 상단 고정 여부 (API·DTO용)
 * DB에는 is_pinned TINYINT(1)로 저장되며, 엔티티는 boolean pinned 사용.
 */
public enum NoticePinType {

    NORMAL,  // 일반 (is_pinned = 0)
    PINNED;   // 상단 고정 (is_pinned = 1)

    /** 엔티티 boolean → enum */
    public static NoticePinType from(boolean pinned) {
        return pinned ? PINNED : NORMAL;
    }

    /** enum → 엔티티 boolean */
    public boolean toBoolean() {
        return this == PINNED;
    }
}