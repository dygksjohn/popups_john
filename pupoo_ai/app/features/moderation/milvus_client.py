"""Milvus 정책 벡터 저장소 어댑터.

기능:
- 정책 청크 임베딩을 Milvus에 저장하고 검색한다.

설명:
- moderation 정책 검색은 이 저장소를 기준으로 동작한다.
- `chunk_text`는 최종 판단이 아니라 검색 근거 스니펫이다.
"""

from __future__ import annotations

from typing import Iterable, List, Optional

from pymilvus import CollectionSchema, DataType, FieldSchema, MilvusClient
from pymilvus.milvus_client import IndexParams

from pupoo_ai.app.core.config import settings


def _ensure_collection(client: MilvusClient, collection_name: str, dim: int) -> None:
    """
    정책 벡터용 컬렉션이 없으면 생성한다.

    컬럼:
    - id: int64 (primary key, auto_id)
    - embedding: float_vector (dim)
    - policy_id: varchar
    - category: varchar
    - source: varchar
    - chunk_text: varchar
    """
    if client.has_collection(collection_name):
        return

    fields = [
        FieldSchema(name="id", dtype=DataType.INT64, is_primary=True, auto_id=True),
        FieldSchema(name="embedding", dtype=DataType.FLOAT_VECTOR, dim=dim),
        FieldSchema(name="policy_id", dtype=DataType.VARCHAR, max_length=128),
        FieldSchema(name="category", dtype=DataType.VARCHAR, max_length=64),
        FieldSchema(name="source", dtype=DataType.VARCHAR, max_length=256),
        FieldSchema(name="chunk_text", dtype=DataType.VARCHAR, max_length=2048),
    ]
    schema = CollectionSchema(fields=fields, description="Policy RAG vectors")

    client.create_collection(
        collection_name=collection_name,
        schema=schema,
        shards_num=2,
    )

    index_params = IndexParams()
    index_params.add_index(
        "embedding",
        index_type="IVF_FLAT",
        index_name="policy_embedding_idx",
        metric_type="COSINE",
        nlist=1024,
    )
    client.create_index(
        collection_name=collection_name,
        index_params=index_params,
    )


class PolicyVectorStore:
    """Milvus 기반 정책 벡터 저장소 래퍼."""

    def __init__(self, dim: int, collection_name: str) -> None:
        self._dim = dim
        self._collection_name = collection_name
        # Milvus 2.x gRPC: URI는 http://host:port (REST 게이트웨이) 또는 host:port
        uri = f"http://{settings.milvus_host}:{settings.milvus_port}"
        user = settings.milvus_username or None
        password = settings.milvus_password or None

        self._client = MilvusClient(
            uri=uri,
            user=user,
            password=password,
            secure=settings.milvus_tls,
            timeout=30,
        )
        _ensure_collection(self._client, collection_name=self._collection_name, dim=dim)

    def upsert(
        self,
        embeddings: List[List[float]],
        policy_ids: List[str],
        categories: Optional[List[str]] = None,
        sources: Optional[List[str]] = None,
        chunks: Optional[List[str]] = None,
    ) -> None:
        """정책 청크 임베딩과 메타데이터를 Milvus에 적재한다."""
        total = len(embeddings)
        if len(policy_ids) != total:
            raise ValueError("embeddings와 policy_ids 길이가 일치하지 않습니다.")

        categories = categories or [""] * total
        sources = sources or [""] * total
        chunks = chunks or [""] * total

        if not (len(categories) == len(sources) == len(chunks) == total):
            raise ValueError("메타데이터 리스트 길이가 일치하지 않습니다.")

        data = [
            {
                "embedding": embedding,
                "policy_id": policy_id,
                "category": category,
                "source": source,
                "chunk_text": chunk,
            }
            for embedding, policy_id, category, source, chunk in zip(
                embeddings, policy_ids, categories, sources, chunks
            )
        ]

        self._client.insert(
            collection_name=self._collection_name,
            data=data,
        )

    def search(
        self,
        query_embeddings: Iterable[List[float]],
        top_k: int = 5,
    ) -> List[List[dict]]:
        """질의 벡터별 상위 정책 청크를 검색한다."""
        try:
            self._client.load_collection(collection_name=self._collection_name)
        except Exception:
            # 기능: load 실패는 search에서 다시 실패시킬 수 있으므로 여기서는 조용히 넘긴다.
            pass

        results = self._client.search(
            collection_name=self._collection_name,
            data=list(query_embeddings),
            anns_field="embedding",
            limit=top_k,
            search_params={"metric_type": "COSINE", "params": {"nprobe": 16}},
            output_fields=["policy_id", "category", "source", "chunk_text"],
        )
