"""watsonx 연동 클라이언트.

기능:
- LLM 기반 moderation 판단을 담당한다.

설명:
- retrieved_docs의 score는 정책 검색 유사도이며 최종 위반 점수와 다르다.
- 이 모듈은 사전 차단 판단만 다루며, 신고 기반 모더레이션 상태 전이는 다루지 않는다.

watsonx.ai LLM 호출.
- 검색된 정책 + 사용자 입력 기반 위반 여부·사유 생성.
- 정책 벡터 임베딩은 embedding_service.py(watsonx Embeddings)에서 담당한다.
- langchain_ibm은 watsonx 사용 시에만 로드.
"""
from __future__ import annotations

import logging
import re
from typing import TYPE_CHECKING, List

from pupoo_ai.app.core.config import settings

if TYPE_CHECKING:
    from langchain_ibm import WatsonxLLM


logger = logging.getLogger(__name__)

ACTION_PATTERN = re.compile(r"\b(BLOCK|PASS|WARN|REVIEW)\b", re.I)
SCORE_PATTERN = re.compile(r"SCORE\s*:\s*([0-9.]+)", re.I)
REASON_PATTERN = re.compile(r"REASON\s*:\s*([^\n]+)", re.I)
FLAGGED_PATTERN = re.compile(r"FLAGGED\s*:\s*([^\n]+)", re.I)
INFERRED_PATTERN = re.compile(r"INFERRED\s*:\s*([^\n]+)", re.I)


def _watsonx_llm_params() -> dict:
    # 기능: watsonx LLM 초기화 파라미터를 구성한다.
    return {
        "url": settings.watsonx_url or "https://us-south.ml.cloud.ibm.com",
        "apikey": settings.watsonx_api_key,
        "project_id": settings.watsonx_project_id,
        "model_id": settings.watsonx_llm_id or "ibm/granite-13b-instruct-v2",
        "params": {"decoding_method": "greedy", "max_new_tokens": 256, "temperature": 0.1},
    }


def is_watsonx_configured() -> bool:
    # 기능: watsonx 호출에 필요한 최소 설정 존재 여부를 판단한다.
    return bool(
        settings.watsonx_api_key
        and settings.watsonx_url
        and settings.watsonx_project_id
    )


def is_watsonx_embedding_configured() -> bool:
    # 기능: watsonx 임베딩 API 호출에 필요한 설정 존재 여부를 판단한다.
    mid = (settings.watsonx_embedding_model_id or "").strip()
    return bool(
        settings.watsonx_api_key
        and settings.watsonx_url
        and settings.watsonx_project_id
        and mid
    )


def get_llm_for_moderation():
    # 기능: moderation 전용 watsonx LLM 인스턴스를 생성한다.
    # 설명: 설정이 없으면 None을 반환해 상위 레이어가 fallback 또는 차단 로직을 결정하게 한다.
    if not is_watsonx_configured():
        logger.warning("watsonx LLM is not configured; moderation will be treated as BLOCK.")
        return None

    from langchain_ibm import WatsonxLLM

    return WatsonxLLM(**_watsonx_llm_params())


def moderate_with_llm(
    user_text: str,
    retrieved_docs: List[dict],
) -> tuple[str, float | None, str | None, list[str] | None, list[str] | None]:
    # 기능: 정책 검색 결과와 사용자 입력을 결합해 최종 PASS/BLOCK 판단을 만든다.
    # 설명: flagged_phrases는 원문에서 직접 잡은 표현이고, inferred_phrases는 정책 문맥으로 해석한 위반 표현이다.
    # 흐름: LLM 준비 -> 프롬프트 생성 -> 응답 파싱 -> action/score/reason/표현 목록 반환.
    logger.info(
        "Starting LLM moderation. text_length=%d, retrieved_docs=%d",
        len(user_text or ""),
        len(retrieved_docs or []),
    )
    logger.info("Moderation input text preview: %s", (user_text or "")[:200])

    llm = get_llm_for_moderation()
    if not llm:
        logger.error("LLM instance is None. Treating moderation result as BLOCK.")
        return "BLOCK", None, "LLM이 설정되지 않아 모더레이션을 수행할 수 없습니다.", None, None

    context_parts = []
    for document in retrieved_docs[:5]:
        context_parts.append(
            f"[{document.get('policy_id', '')}] {document.get('chunk_text', '')[:300]}"
        )
    context = "\n\n".join(context_parts) if context_parts else "관련 정책 없음."

    prompt = f"""너는 PUPOO 커뮤니티 게시글 모더레이션 심사기다. 정책과 사용자 입력을 함께 보고 최종 판정을 내려라.

판정 기준:
- PASS: 정책 위반이 명확하지 않고 일반적인 일상 대화, 후기, 정보 공유 수준이다.
- WARN: 불쾌감이나 공격성이 있지만 즉시 차단할 정도로 명확한 위반은 아니다.
- REVIEW: 문맥상 애매하거나 운영자 재검토가 필요하다.
- BLOCK: 폭력·살해·해침 위협, 심한 비하·혐오·차별, 불법성, 음란성, 광고성 도배 등 명확한 위반이다.

중요 규칙:
- 참고 정책 중에는 운영 기준용 문서가 섞여 있을 수 있다. 정책 제목만 보고 과잉 차단하지 말고 실제 사용자 입력 자체를 기준으로 판단하라.
- 평범한 반려동물 일상 글, 정보 공유 글, 감상문은 PASS를 우선 검토하라.
- 사람이나 집단에 대한 직접적 해침 의도, 협박, 살해 표현은 BLOCK이다.
- 경계 사례는 WARN 또는 REVIEW를 사용할 수 있다.
- 반드시 아래 출력 형식만 사용하고, 형식 외 문장은 추가하지 마라.

## 참고 정책
{context}

## 사용자 입력
{user_text[:1000]}

## 응답 형식
ACTION: BLOCK, WARN, REVIEW, PASS 중 하나
SCORE: 0.0부터 1.0 사이 숫자 하나
REASON: 판정 이유 한 줄
FLAGGED: 입력 원문에서 직접 확인된 문제 표현 목록. 없으면 없음
INFERRED: 정책 문맥상 추론된 위반 유형 또는 표현 목록. 없으면 없음
"""

    try:
        output = llm.invoke(prompt)
        logger.debug("LLM raw output: %s", (output or "")[:500])
        output = (output or "").strip()
        lines = [line.strip() for line in output.splitlines() if line.strip()]

        action = None
        for m in ACTION_PATTERN.finditer(output):
            action = m.group(1).upper()
            break
        if action not in ("BLOCK", "PASS", "WARN", "REVIEW"):
            logger.error("LLM output parse failed: ACTION token is missing or invalid. Treating as BLOCK.")
            return "BLOCK", None, "LLM 출력 파싱 실패(ACTION 미검출)로 차단되었습니다.", None, None
        logger.info(
            "LLM moderation parsed action=%s, ai_score_raw=%s",
            action,
            SCORE_PATTERN.search(output).group(1) if SCORE_PATTERN.search(output) else None,
        )

        ai_score: float | None = None
        score_match = SCORE_PATTERN.search(output)
        if score_match:
            try:
                value = float(score_match.group(1))
                ai_score = max(0.0, min(1.0, value))
            except (ValueError, TypeError):
                pass

        reason = None
        flagged_phrases: list[str] = []
        inferred_phrases: list[str] = []

        reason_match = REASON_PATTERN.search(output)
        if reason_match:
            reason = reason_match.group(1).strip() or None

        flagged_match = FLAGGED_PATTERN.search(output)
        if flagged_match:
            rest = flagged_match.group(1).strip()
            if rest and "없음" not in rest:
                raw = [phrase.strip() for phrase in re.split(r"[,，]", rest) if phrase.strip()]
                flagged_phrases = list(dict.fromkeys(raw))

        inferred_match = INFERRED_PATTERN.search(output)
        if inferred_match:
            rest = inferred_match.group(1).strip()
            if rest and "없음" not in rest:
                raw = [phrase.strip() for phrase in re.split(r"[,，]", rest) if phrase.strip()]
                inferred_phrases = list(dict.fromkeys(raw))

        for line in lines:
            upper_line = line.upper()
            if (
                upper_line.startswith("ACTION:")
                or upper_line.startswith("SCORE:")
                or upper_line.startswith("REASON:")
                or "FLAGGED" in upper_line
                or "INFERRED" in upper_line
            ):
                continue
            if not reason and line and len(line) <= 200:
                reason = line
                break
        if not reason and len(output) > 20:
            reason = output[:200]

        logger.info(
            "LLM moderation success. action=%s, ai_score=%s, reason=%s, flagged_count=%d, inferred_count=%d",
            action,
            ai_score,
            (reason or "")[:100],
            len(flagged_phrases),
            len(inferred_phrases),
        )
        return (
            action,
            ai_score,
            reason,
            flagged_phrases if flagged_phrases else None,
            inferred_phrases if inferred_phrases else None,
        )
    except Exception:
        logger.exception("LLM moderation failed due to exception. Treating moderation result as BLOCK.")
        return "BLOCK", None, "watsonx 호출 중 오류가 발생했습니다.", None, None
