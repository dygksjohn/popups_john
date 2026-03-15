from __future__ import annotations

from pathlib import Path
from typing import List, Tuple

from pupoo_ai.app.features.moderation.chunking import PolicyChunk, load_policy_chunks
from pupoo_ai.app.features.moderation.embedding_service import get_embedding_service
from pupoo_ai.app.features.moderation.milvus_client import PolicyVectorStore
from pupoo_ai.app.features.moderation.watsonx_client import is_watsonx_configured, moderate_with_llm


# pupoo_ai/policy_docs (app과 형제 디렉터리)
POLICY_DOC_ROOT = Path(__file__).resolve().parent.parent.parent.parent / "policy_docs"


def build_policy_index(dry_run: bool = False) -> Tuple[int, int]:
    """
    정책 문서를 로딩·청킹·임베딩하여 Milvus에 적재한다.

    Args:
        dry_run: True면 Milvus 연결/적재 없이 청크 수·차원만 반환 (로딩 확인용).

    Returns:
        (총 청크 수, 임베딩 차원)
    """
    chunks: List[PolicyChunk] = load_policy_chunks(POLICY_DOC_ROOT)
    if not chunks:
        return 0, 0

    embedder = get_embedding_service()
    if dry_run:
        return len(chunks), embedder.dim

    texts = [c.text for c in chunks]
    vectors = embedder.embed_texts(texts)
    store = PolicyVectorStore(dim=embedder.dim)
    store.upsert(
        embeddings=vectors,
        policy_ids=[c.policy_id for c in chunks],
        categories=[c.category for c in chunks],
        sources=[c.source for c in chunks],
        chunks=[c.text for c in chunks],
    )
    return len(chunks), embedder.dim


def retrieve_policies(query: str, top_k: int = 5) -> List[dict]:
    """
    질의 텍스트에 대해 상위 정책 청크를 검색한다.
    """
    embedder = get_embedding_service()
    q_vecs = embedder.embed_texts([query])
    store = PolicyVectorStore(dim=embedder.dim)
    results = store.search(q_vecs, top_k=top_k)
    if not results:
        return []

    hits = results[0]
    docs: List[dict] = []
    for hit in hits:
        fields = hit.get("entity", {})
        docs.append(
            {
                "score": float(hit.get("distance", 0.0)),
                "policy_id": fields.get("policy_id", ""),
                "category": fields.get("category", ""),
                "source": fields.get("source", ""),
                "chunk_text": fields.get("chunk_text", ""),
            }
        )
    return docs


def moderate_with_rag(text: str) -> tuple[str, float | None, str | None, str, list[str] | None, list[str] | None]:
    """
    RAG 기반 모더레이션: 정책 검색 후 watsonx LLM으로 판정·사유·문제 문구(원문·유추) 생성.
    - watsonx 미설정 시: 검색 결과 유무로 PASS/REVIEW만 반환(스텁).
    """
    docs = retrieve_policies(text, top_k=5)

    if is_watsonx_configured():
        action, ai_score, reason, flagged_phrases, inferred_phrases = moderate_with_llm(text, docs)
        return action, ai_score, reason, "rag_watsonx", flagged_phrases, inferred_phrases

    if not docs:
        return "PASS", 0.0, None, "rag_milvus_stub", None, None
    reasons = []
    for d in docs:
        snippet = d["chunk_text"][:200].replace("\n", " ")
        reasons.append(f"[{d['policy_id']}] {snippet}")
    return "REVIEW", None, "\n".join(reasons), "rag_milvus_stub", None, None

