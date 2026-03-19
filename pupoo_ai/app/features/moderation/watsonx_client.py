"""watsonx 연동 클라이언트.

기능:
- 임베딩 생성과 LLM 기반 moderation 판단을 담당한다.

설명:
- retrieved_docs의 score는 정책 검색 유사도이며 최종 위반 점수와 다르다.
- 이 모듈은 사전 차단 판단만 다루며, 신고 기반 모더레이션 상태 전이는 다루지 않는다.
"""

from __future__ import annotations

import logging
import re
from typing import TYPE_CHECKING, Iterable, List

from pupoo_ai.app.core.config import settings

if TYPE_CHECKING:
    from langchain_ibm import WatsonxEmbeddings, WatsonxLLM


logger = logging.getLogger(__name__)

ACTION_PATTERN = re.compile(r"\b(BLOCK|PASS)\b", re.I)
SCORE_PATTERN = re.compile(r"SCORE\s*:\s*([0-9.]+)", re.I)
FLAGGED_PATTERN = re.compile(r"FLAGGED\s*:\s*([^\n]+)", re.I)
INFERRED_PATTERN = re.compile(r"INFERRED\s*:\s*([^\n]+)", re.I)


def _watsonx_embedding_params() -> dict:
    # 기능: watsonx 임베딩 클라이언트 초기화 파라미터를 구성한다.
    return {
        "url": settings.watsonx_url or "https://us-south.ml.cloud.ibm.com",
        "api_key": settings.watsonx_api_key,
        "project_id": settings.watsonx_project_id,
        "model_id": settings.watsonx_embedding_model_id or "ibm/slate-125m-english-rtrvr",
    }


def _watsonx_llm_params() -> dict:
    # 기능: watsonx LLM 초기화 파라미터를 구성한다.
    return {
        "url": settings.watsonx_url or "https://us-south.ml.cloud.ibm.com",
        "api_key": settings.watsonx_api_key,
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


class WatsonxEmbeddingService:
    # 기능: watsonx 임베딩 서비스를 project 내부 인터페이스에 맞춰 감싼다.
    def __init__(self) -> None:
        from langchain_ibm import WatsonxEmbeddings

        params = _watsonx_embedding_params()
        self._embeddings: WatsonxEmbeddings = WatsonxEmbeddings(**params)
        self._dim = settings.watsonx_embedding_dim

    @property
    def dim(self) -> int:
        return self._dim

    def embed_texts(self, texts: Iterable[str]) -> List[List[float]]:
        text_list = list(texts)
        if not text_list:
            return []
        return self._embeddings.embed_documents(text_list)


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

    prompt = f"""당신은 콘텐츠 모더레이션 시스템입니다. 정책과 사용자 입력을 보고 위반 여부를 판단하고 아래 형식으로만 답변하세요.

## 참고 정책
{context}

## 사용자 입력
{user_text[:1000]}

## 응답 형식
ACTION: BLOCK 또는 ACTION: PASS
SCORE: 0.0부터 1.0 사이 숫자 하나
사유 한 줄
FLAGGED: 입력 원문에서 직접 확인된 문제 표현 목록. 없으면 없음
INFERRED: 정책 문맥상 추론된 위반 유형 또는 표현 목록. 없으면 없음
"""

    try:
        output = llm.invoke(prompt)
        logger.debug("LLM raw output: %s", (output or "")[:500])
        output = (output or "").strip()
        lines = [line.strip() for line in output.splitlines() if line.strip()]

        action = "PASS"
        for match in ACTION_PATTERN.finditer(output):
            action = match.group(1).upper()
            break
        if action not in ("BLOCK", "PASS"):
            action = "PASS"

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
            if upper_line.startswith("ACTION:") or upper_line.startswith("SCORE:") or "FLAGGED" in upper_line or "INFERRED" in upper_line:
                continue
            if line and len(line) <= 200:
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
