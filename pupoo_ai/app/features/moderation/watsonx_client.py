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


def moderate_with_llm(user_text: str, retrieved_docs: List[dict]) -> tuple[str, str | None]:
    """
    검색된 정책 청크와 사용자 입력을 watsonx LLM에 넘겨 판정·사유를 생성한다.

    Returns:
        (action, reason) — action은 BLOCK | PASS | REVIEW, reason은 LLM이 생성한 사유 또는 None.
    """
    llm = get_llm_for_moderation()
    if not llm:
        return "PASS", None

    context_parts = []
    for d in retrieved_docs[:5]:
        context_parts.append(
            f"[{d.get('policy_id', '')}] {d.get('chunk_text', '')[:300]}"
        )
    context = "\n\n".join(context_parts) if context_parts else "관련 정책 없음."

    prompt = f"""다음은 서비스 정책 조각과 사용자가 게시하려는 내용입니다.
정책에 위반되는지 판단하고, 응답을 반드시 다음 한 줄로 시작하세요: ACTION: BLOCK 또는 ACTION: PASS 또는 ACTION: REVIEW
그 다음 줄에 짧은 사유를 작성하세요.

## 참고 정책
{context}

## 사용자 입력
{user_text[:1000]}

## 응답 (ACTION: ... 로 시작)
"""

    try:
        out = llm.invoke(prompt)
        out = (out or "").strip()
        action = "PASS"
        for m in ACTION_PATTERN.finditer(out):
            action = m.group(1).upper()
            break
        if action not in ("BLOCK", "PASS", "REVIEW"):
            action = "REVIEW"
        reason = out if len(out) > 20 else None
        return action, reason
    except Exception:
        return "REVIEW", "watsonx 호출 중 오류가 발생했습니다."
