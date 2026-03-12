package com.popups.pupoo.board.bannedword.domain.enums;

/**
 * 금칙어 카테고리 (board_banned_words.category)
 * - 이용약관_금지행위_초안.md 및 RAG 모더레이션 판정과 동일 코드 사용
 */
public enum BannedWordCategory {
    LEGAL_RESTRICTION,   // 법적/불법 정보
    ABUSE_INSULT,        // 욕설 및 비하
    HATE_SPEECH,         // 혐오 및 차별
    ADULT_CONTENT,       // 음란 및 선정성
    SPAM_ADVERTISING,    // 광고 및 도배
    PET_SENSITIVE,       // 애견 플랫폼 특화(민감어)
    COMMERCIAL_SALE,     // 영리 목적 분양/교배
    SYSTEM_ABUSE,        // 시스템 어뷰징/티켓
    OTHER                // 기타
}
