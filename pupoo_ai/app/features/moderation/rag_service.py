"""RAG 기반 모더레이션 조합 서비스."""

from __future__ import annotations

import logging
import re
from pathlib import Path
from typing import List, Tuple

from pupoo_ai.app.features.moderation.chunking import PolicyChunk, load_policy_chunks
from pupoo_ai.app.features.moderation.embedding_service import get_embedding_service
from pupoo_ai.app.features.moderation.milvus_client import PolicyVectorStore
from pupoo_ai.app.features.moderation.policy_state import load_active_policy
from pupoo_ai.app.features.moderation.watsonx_client import is_watsonx_configured, moderate_with_llm

POLICY_DOC_ROOT = Path(__file__).resolve().parent.parent.parent.parent / "policy_docs"
logger = logging.getLogger(__name__)

_SPACE_PATTERN = re.compile(r"\s+")
_HARD_BLOCK_TERMS = (
    "죽여버리고싶",
    "죽여버릴거",
    "죽이고싶",
    "죽인다",
    "죽어버려",
    "죽어라",
    "해치고싶",
    "칼로찔러",
    "살인하고싶",
    "없애버리고싶",
)
_WARN_TERMS = (
    "욕이나올것같",
    "꺼져버렸으면좋겠",
    "한대치고싶",
    "패고싶",
)


def _precheck_text(text: str) -> tuple[str, str, list[str] | None] | None:
    compact = _SPACE_PATTERN.sub("", text or "").lower()

    matched_block = [term for term in _HARD_BLOCK_TERMS if term in compact]
    if matched_block:
        return (
            "BLOCK",
            "직접적인 위해 또는 폭력 표현이 감지되어 등록이 차단됩니다.",
            matched_block,
        )

    matched_warn = [term for term in _WARN_TERMS if term in compact]
    if matched_warn:
        return (
            "WARN",
            "공격적 표현이 감지되어 주의가 필요합니다.",
            matched_warn,
        )

    return None


def build_policy_index(dry_run: bool = False) -> Tuple[int, int]:
    chunks: List[PolicyChunk] = load_policy_chunks(POLICY_DOC_ROOT)
    if not chunks:
        return 0, 0

    embedder = get_embedding_service()
    if dry_run:
        return len(chunks), embedder.dim

    texts = [chunk.text for chunk in chunks]
    vectors = embedder.embed_texts(texts)
    active = load_active_policy()
    store = PolicyVectorStore(dim=embedder.dim, collection_name=active.collection)
    store.upsert(
        embeddings=vectors,
        policy_ids=[chunk.policy_id for chunk in chunks],
        categories=[chunk.category for chunk in chunks],
        sources=[chunk.source for chunk in chunks],
        chunks=[chunk.text for chunk in chunks],
    )
    return len(chunks), embedder.dim


def retrieve_policies(query: str, top_k: int = 5) -> List[dict]:
    embedder = get_embedding_service()
    q_vecs = embedder.embed_texts([query])
    active = load_active_policy()
    store = PolicyVectorStore(dim=embedder.dim, collection_name=active.collection)
    results = store.search(q_vecs, top_k=top_k)
    if not results:
        return []

    documents: List[dict] = []
    for hit in results[0]:
        fields = hit.get("entity", {})
        documents.append(
            {
                "score": float(hit.get("distance", 0.0)),
                "policy_id": fields.get("policy_id", ""),
                "category": fields.get("category", ""),
                "source": fields.get("source", ""),
                "chunk_text": fields.get("chunk_text", ""),
            }
        )
    return documents


def moderate_with_rag(
    text: str,
    board_type: str | None = None,
    metadata: dict | None = None,
) -> tuple[str, float | None, str | None, str, list[str] | None, list[str] | None]:
    safe_metadata = metadata or {}
    logger.info(
        "Moderation pipeline input. board_type=%s text_preview=%s metadata=%s",
        board_type,
        (text or "")[:200],
        safe_metadata,
    )

    precheck = _precheck_text(text)
    if precheck is not None:
        decision, reason, matched_terms = precheck
        logger.info(
            "Moderation precheck hit. board_type=%s decision=%s matched_terms=%s",
            board_type,
            decision,
            matched_terms,
        )
        return decision, 1.0 if decision == "BLOCK" else 0.7, reason, "keyword_precheck", matched_terms, None

    try:
        docs = retrieve_policies(text, top_k=5)
    except Exception:
        logger.exception("Milvus policy retrieval failed. board_type=%s metadata=%s", board_type, safe_metadata)
        return "BLOCK", None, "정책 검색에 실패하여 등록이 차단됩니다.", "rag_error", None, None

    if not docs:
        logger.error("No policy documents were retrieved. board_type=%s metadata=%s", board_type, safe_metadata)
        return "BLOCK", None, "활성 정책을 찾지 못해 등록이 차단됩니다.", "rag_empty", None, None

    if not is_watsonx_configured():
        logger.error("watsonx is not configured. board_type=%s metadata=%s", board_type, safe_metadata)
        return "BLOCK", None, "금칙어 검토를 완료하지 못해 등록이 차단됩니다.", "rag_watsonx_unconfigured", None, None

    try:
        action, ai_score, reason, flagged_phrases, inferred_phrases = moderate_with_llm(text, docs)
    except Exception:
        logger.exception("watsonx moderation failed. board_type=%s metadata=%s", board_type, safe_metadata)
        return "BLOCK", None, "금칙어 검토를 완료하지 못해 등록이 차단됩니다.", "rag_error", None, None

    normalized = str(action or "").upper()
    if normalized == "PASS":
        normalized = "ALLOW"
    elif normalized not in {"ALLOW", "WARN", "REVIEW", "BLOCK"}:
        normalized = "BLOCK"

    final_reason = reason or (
        "정책 위반 가능성은 낮습니다."
        if normalized in {"ALLOW", "WARN", "REVIEW"}
        else "정책 위반 가능성이 있어 등록이 차단됩니다."
    )
    logger.info(
        "Moderation pipeline final decision. board_type=%s decision=%s score=%s",
        board_type,
        normalized,
        ai_score,
    )
    return normalized, ai_score, final_reason, "rag_watsonx", flagged_phrases, inferred_phrases
