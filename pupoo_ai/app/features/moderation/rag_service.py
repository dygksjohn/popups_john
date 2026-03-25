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
_SEED_SOURCE_NAME = "moderation_seed_examples.json"
_SEED_SCORE_THRESHOLDS = {
    "ALLOW": 0.84,
    "WARN": 0.82,
    "REVIEW": 0.82,
    "BLOCK": 0.82,
}


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


def _seed_decision_from_policy_id(policy_id: str | None) -> str | None:
    normalized = str(policy_id or "").upper()
    if normalized.startswith("SEED-ALLOW-"):
        return "ALLOW"
    if normalized.startswith("SEED-WARN-"):
        return "WARN"
    if normalized.startswith("SEED-REVIEW-"):
        return "REVIEW"
    if normalized.startswith("SEED-BLOCK-"):
        return "BLOCK"
    return None


def _shortcut_from_retrieved_docs(docs: list[dict]) -> tuple[str, float, str, list[str] | None] | None:
    if not docs:
        return None

    for document in docs:
        source = str(document.get("source") or "")
        policy_id = str(document.get("policy_id") or "")
        score = float(document.get("score") or 0.0)
        decision = _seed_decision_from_policy_id(policy_id)

        if not decision:
            continue
        if not source.endswith(_SEED_SOURCE_NAME):
            continue
        if score < _SEED_SCORE_THRESHOLDS[decision]:
            continue

        if decision == "ALLOW":
            return "ALLOW", score, "운영 시드 예시와 매우 유사한 일반 문장으로 판단됩니다.", None
        if decision == "WARN":
            return "WARN", score, "운영 시드 예시와 유사한 공격적 표현으로 주의가 필요합니다.", None
        if decision == "REVIEW":
            return "REVIEW", score, "운영 시드 예시와 유사해 검토 대기 처리합니다.", None
        return "BLOCK", score, "운영 시드 예시와 유사한 위해 표현으로 등록이 차단됩니다.", None

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
        docs = retrieve_policies(text, top_k=8)
    except Exception:
        logger.exception("Milvus policy retrieval failed. board_type=%s metadata=%s", board_type, safe_metadata)
        return "BLOCK", None, "정책 검색에 실패하여 등록이 차단됩니다.", "rag_error", None, None

    if not docs:
        logger.error("No policy documents were retrieved. board_type=%s metadata=%s", board_type, safe_metadata)
        return "BLOCK", None, "활성 정책을 찾지 못해 등록이 차단됩니다.", "rag_empty", None, None

    shortcut = _shortcut_from_retrieved_docs(docs)
    if shortcut is not None:
        decision, score, reason, flagged_phrases = shortcut
        logger.info(
            "Moderation seed shortcut hit. board_type=%s decision=%s score=%s",
            board_type,
            decision,
            score,
        )
        return decision, score, reason, "seed_shortcut", flagged_phrases, None

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
