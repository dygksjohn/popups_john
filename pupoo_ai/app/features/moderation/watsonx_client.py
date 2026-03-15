"""
watsonx.ai 연동: 임베딩 및 LLM 호출.
- 임베딩: 정책/쿼리 텍스트 벡터화 (RAG 검색용).
- LLM: 검색된 정책 + 사용자 입력 기반 위반 여부·사유 생성.
- langchain_ibm은 watsonx 사용 시에만 로드 (미설치 시 Stub 임베딩만 사용 가능).
"""
from __future__ import annotations

import re
from typing import TYPE_CHECKING, Iterable, List

from pupoo_ai.app.core.config import settings

if TYPE_CHECKING:
    from langchain_ibm import WatsonxEmbeddings, WatsonxLLM

# LLM 출력 파싱용: action은 BLOCK | PASS | REVIEW
ACTION_PATTERN = re.compile(r"\b(BLOCK|PASS|REVIEW)\b", re.I)
# SCORE: 0.0~1.0 (위반일수록 1에 가깝게)
SCORE_PATTERN = re.compile(r"SCORE\s*:\s*([0-9.]+)", re.I)
# FLAGGED / INFERRED 내용 추출 (줄 순서·형식에 덜 의존)
FLAGGED_PATTERN = re.compile(r"FLAGGED\s*:\s*([^\n]+)", re.I)
INFERRED_PATTERN = re.compile(r"INFERRED\s*:\s*([^\n]+)", re.I)


def _watsonx_embedding_params() -> dict:
    return {
        "url": settings.watsonx_url or "https://us-south.ml.cloud.ibm.com",
        "api_key": settings.watsonx_api_key,
        "project_id": settings.watsonx_project_id,
        "model_id": settings.watsonx_embedding_model_id or "ibm/slate-125m-english-rtrvr",
    }


def _watsonx_llm_params() -> dict:
    return {
        "url": settings.watsonx_url or "https://us-south.ml.cloud.ibm.com",
        "api_key": settings.watsonx_api_key,
        "project_id": settings.watsonx_project_id,
        "model_id": settings.watsonx_llm_id or "ibm/granite-13b-instruct-v2",
        "params": {"decoding_method": "greedy", "max_new_tokens": 256, "temperature": 0.1},
    }


def is_watsonx_configured() -> bool:
    """watsonx 호출에 필요한 설정이 있는지 여부."""
    return bool(
        settings.watsonx_api_key
        and settings.watsonx_url
        and settings.watsonx_project_id
    )


class WatsonxEmbeddingService:
    """watsonx.ai 임베딩 모델 래퍼. embed_texts() 및 dim 제공."""

    def __init__(self) -> None:
        from langchain_ibm import WatsonxEmbeddings
        params = _watsonx_embedding_params()
        self._embeddings = WatsonxEmbeddings(**params)
        self._dim = settings.watsonx_embedding_dim

    @property
    def dim(self) -> int:
        return self._dim

    def embed_texts(self, texts: Iterable[str]) -> List[List[float]]:
        texts_list = list(texts)
        if not texts_list:
            return []
        return self._embeddings.embed_documents(texts_list)


def get_llm_for_moderation():
    """모더레이션용 watsonx LLM. 미설정 시 None."""
    if not is_watsonx_configured():
        return None
    from langchain_ibm import WatsonxLLM
    return WatsonxLLM(**_watsonx_llm_params())


def moderate_with_llm(user_text: str, retrieved_docs: List[dict]) -> tuple[str, float | None, str | None, list[str] | None, list[str] | None]:
    """
    검색된 정책 청크와 사용자 입력을 watsonx LLM에 넘겨 판정·점수·사유·문제 문구를 생성한다.
    문맥을 파악해 요청에 있는 원문 문구와, 그 문맥에서 유추된 위반 관련 단어를 구분해 반환한다.

    Returns:
        (action, ai_score, reason, flagged_phrases, inferred_phrases) — ai_score는 0.0~1.0 (위반일수록 1에 가깝게).
    """
    llm = get_llm_for_moderation()
    if not llm:
        return "PASS", None, None, None, None

    context_parts = []
    for d in retrieved_docs[:5]:
        context_parts.append(
            f"[{d.get('policy_id', '')}] {d.get('chunk_text', '')[:300]}"
        )
    context = "\n\n".join(context_parts) if context_parts else "관련 정책 없음."

    prompt = f"""당신은 콘텐츠 모더레이션 봇입니다. 정책과 사용자 입력을 보고 위반 여부를 판단한 뒤, 반드시 아래 형식으로만 답하세요.

## 참고 정책
{context}

## 사용자 입력
{user_text[:1000]}

## 응답 형식 (FLAGGED·INFERRED·SCORE 키워드는 반드시 영문으로 적으세요.)
ACTION: BLOCK 또는 ACTION: PASS 또는 ACTION: REVIEW
SCORE: 0.0부터 1.0 사이 숫자 하나 (위반일수록 1에 가깝게, 통과일수록 0에 가깝게)
(사유 한 줄 - 위반 조항명만)
FLAGGED: 사용자 입력에 **실제로 적힌 문구만** 원문 그대로 쉼표로 나열. 오타·비속어는 맞춤법이나 표준어로 고치지 말 것. (예: 입력에 "세엑스"가 있으면 FLAGGED에 "세엑스"로 적기. "섹스"로 바꾸지 말 것.) 없으면 없음
INFERRED: FLAGGED 문구를 분석한 결과·표준화된 위반 유형을 쉼표로 나열. (예: 세엑스→섹스, 욕설, 성적콘텐츠. 원문이 아닌 해석·카테고리만) 없으면 없음

## 응답
"""

    try:
        out = llm.invoke(prompt)
        out = (out or "").strip()
        lines = [ln.strip() for ln in out.splitlines() if ln.strip()]

        action = "PASS"
        for m in ACTION_PATTERN.finditer(out):
            action = m.group(1).upper()
            break
        if action not in ("BLOCK", "PASS", "REVIEW"):
            action = "REVIEW"

        ai_score: float | None = None
        m_score = SCORE_PATTERN.search(out)
        if m_score:
            try:
                val = float(m_score.group(1))
                ai_score = max(0.0, min(1.0, val))
            except (ValueError, TypeError):
                pass

        reason = None
        flagged_phrases: list[str] = []
        inferred_phrases: list[str] = []

        # FLAGGED: 전체 출력에서 정규식으로 추출 (줄 순서 무관)
        m_flagged = FLAGGED_PATTERN.search(out)
        if m_flagged:
            rest = m_flagged.group(1).strip()
            if rest and "없음" not in rest.upper():
                raw = [p.strip() for p in re.split(r"[,，]", rest) if p.strip()]
                flagged_phrases = list(dict.fromkeys(raw))  # 순서 유지, 중복 제거

        # INFERRED: 전체 출력에서 정규식으로 추출
        m_inferred = INFERRED_PATTERN.search(out)
        if m_inferred:
            rest = m_inferred.group(1).strip()
            if rest and "없음" not in rest.upper():
                raw = [p.strip() for p in re.split(r"[,，]", rest) if p.strip()]
                inferred_phrases = list(dict.fromkeys(raw))  # 순서 유지, 중복 제거

        # 사유: ACTION/SCORE/FLAGGED/INFERRED가 아닌 첫 번째 줄 (한 줄, 200자 이하)
        for ln in lines:
            u = ln.upper()
            if u.startswith("ACTION:") or u.startswith("SCORE:") or "FLAGGED" in u or "INFERRED" in u:
                continue
            if ln and len(ln) <= 200:
                reason = ln
                break
        if not reason and len(out) > 20:
            reason = out[:200]

        return action, ai_score, reason, flagged_phrases if flagged_phrases else None, inferred_phrases if inferred_phrases else None
    except Exception:
        return "REVIEW", None, "watsonx 호출 중 오류가 발생했습니다.", None, None
