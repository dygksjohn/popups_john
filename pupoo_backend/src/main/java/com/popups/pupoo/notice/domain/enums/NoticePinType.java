/* file: src/main/java/com/popups/pupoo/notice/domain/enums/NoticePinType.java
 * 목적: 공지 상단 고정 여부 표현용 Enum
 * 주의: DB는 notices.is_pinned(TINYINT)로 저장된다.
 */
package com.popups.pupoo.notice.domain.enums;

public enum NoticePinType {
    PINNED, UNPINNED
}
