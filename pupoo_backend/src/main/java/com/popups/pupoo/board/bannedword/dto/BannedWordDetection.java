package com.popups.pupoo.board.bannedword.dto;

import com.popups.pupoo.board.bannedword.domain.enums.BannedWordCategory;
import com.popups.pupoo.board.bannedword.domain.enums.FilterAction;
import lombok.Builder;
import lombok.Getter;

/**
 * 금칙어 검출 결과 (정책 연동 후 BLOCK 시에는 예외 발생, MASK/PASS만 반환 대상)
 */
@Getter
@Builder
public class BannedWordDetection {

    private final String detectedWord;
    private final BannedWordCategory category;
    private final FilterAction filterActionTaken;
}
