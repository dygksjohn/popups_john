"""RAG 기반 모더레이션 조합 서비스.

기능:
- 정책 문서 로드, 인덱싱, 정책 검색, 최종 moderation 판단 조합을 담당한다.

설명:
- 이 모듈은 저장 전 사전 차단 흐름에만 사용된다.
- 신고 접수 후 관리자 승인으로 상태를 바꾸는 신고 기반 모더레이션과는 역할이 다르다.
- policy_docs는 현재 단일 canonical 파일이 아니라 디렉터리 아래 여러 JSON/TXT를 함께 읽는다.

흐름:
- 정책 로드 -> 임베딩 생성 -> Milvus 저장/검색 -> watsonx 또는 fallback으로 판단
"""

from __future__ import annotations

import logging
from pathlib import Path
from typing import List, Tuple

from pupoo_ai.app.features.moderation.chunking import PolicyChunk, load_policy_chunks
from pupoo_ai.app.features.moderation.embedding_service import get_embedding_service
from pupoo_ai.app.features.moderation.milvus_client import PolicyVectorStore
from pupoo_ai.app.features.moderation.policy_state import load_active_policy
from pupoo_ai.app.features.moderation.watsonx_client import is_watsonx_configured, moderate_with_llm

POLICY_DOC_ROOT = Path(__file__).resolve().parent.parent.parent.parent / "policy_docs"
logger = logging.getLogger(__name__)


def build_policy_index(dry_run: bool = False) -> Tuple[int, int]:
    # 기능: 정책 문서를 임베딩해 Milvus 인덱스를 구축한다.
    # 설명: dry-run이면 실제 적재 없이 청크 수와 임베딩 차원만 확인한다.
    # 흐름: 정책 로드 -> 임베더 선택 -> dry-run 분기 -> 임베딩 생성 -> Milvus upsert.
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
    # 기능: 입력 문장과 유사한 정책 청크를 검색한다.
    # 설명: score는 벡터 검색 결과의 거리 값이며, 정책 위반 확률이 아니라 검색 유사도 성격이다.
    # 흐름: 질의 임베딩 생성 -> Milvus 검색 -> 결과 필드 정규화.
    embedder = get_embedding_service()
    q_vecs = embedder.embed_texts([query])
    active = load_active_policy()
    store = PolicyVectorStore(dim=embedder.dim, collection_name=active.collection)
    results = store.search(q_vecs, top_k=top_k)
    if not results:
        return []

    hits = results[0]
    documents: List[dict] = []
    for hit in hits:
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


def moderate_with_rag(text: str) -> tuple[str, float | None, str | None, str, list[str] | None, list[str] | None]:
    """
    RAG 기반 모더레이션: 정책 검색 후 watsonx LLM으로 판정·사유·문제 문구(원문·유추) 생성.
    - 운영 정책: watsonx 미설정/오류 등 예상치 못한 상황은 안전하게 BLOCK 처리한다.
    """
    docs = retrieve_policies(text, top_k=5)

    if is_watsonx_configured():
        action, ai_score, reason, flagged_phrases, inferred_phrases = moderate_with_llm(text, docs)
        return action, ai_score, reason, "rag_watsonx", flagged_phrases, inferred_phrases

    logger.error("watsonx is not configured. Treating moderation result as BLOCK.")
    return "BLOCK", None, "watsonx 설정이 없어 모더레이션을 수행할 수 없습니다.", "rag_milvus_stub", None, None

    reasons = []
    for document in docs:
        snippet = document["chunk_text"][:200].replace("\n", " ")
        reasons.append(f"[{document['policy_id']}] {snippet}")

    # 기능: watsonx가 없을 때는 정책 근거만 반환하고 차단 결론을 강제하지 않는다.
    # 설명: 이 fallback score는 검색 보조 정보일 뿐 canonical 정책 판단을 대체하지 않는다.
    return "PASS", None, "\n".join(reasons), "rag_milvus_stub", None, None
