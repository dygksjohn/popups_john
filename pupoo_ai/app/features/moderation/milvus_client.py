from __future__ import annotations

from typing import Iterable, List, Optional

from pymilvus import (
    CollectionSchema,
    DataType,
    FieldSchema,
    MilvusClient,
)
from pymilvus.milvus_client import IndexParams

from pupoo_ai.app.core.config import settings


POLICY_COLLECTION_NAME = settings.milvus_collection


def _ensure_collection(client: MilvusClient, dim: int) -> None:
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
    if client.has_collection(POLICY_COLLECTION_NAME):
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
        collection_name=POLICY_COLLECTION_NAME,
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
        collection_name=POLICY_COLLECTION_NAME,
        index_params=index_params,
    )


class PolicyVectorStore:
    """Milvus 기반 정책 벡터 스토어 래퍼."""

    def __init__(self, dim: int) -> None:
        self._dim = dim
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
        _ensure_collection(self._client, dim)

    def upsert(
        self,
        embeddings: List[List[float]],
        policy_ids: List[str],
        categories: Optional[List[str]] = None,
        sources: Optional[List[str]] = None,
        chunks: Optional[List[str]] = None,
    ) -> None:
        """
        정책 청크 임베딩 upsert.
        길이는 모두 동일해야 한다.
        """
        n = len(embeddings)
        if not (len(policy_ids) == n):
            raise ValueError("embeddings와 policy_ids 길이가 다릅니다.")

        categories = categories or [""] * n
        sources = sources or [""] * n
        chunks = chunks or [""] * n

        if not (len(categories) == len(sources) == len(chunks) == n):
            raise ValueError("메타데이터 리스트 길이가 일치하지 않습니다.")

        # MilvusClient.insert()는 행 단위 dict 리스트를 기대함 (한 행 = embedding 1개 + 메타데이터)
        data = [
            {
                "embedding": emb,
                "policy_id": pid,
                "category": cat,
                "source": src,
                "chunk_text": ch,
            }
            for emb, pid, cat, src, ch in zip(
                embeddings, policy_ids, categories, sources, chunks
            )
        ]

        self._client.insert(
            collection_name=POLICY_COLLECTION_NAME,
            data=data,
        )

    def search(
        self,
        query_embeddings: Iterable[List[float]],
        top_k: int = 5,
    ) -> List[List[dict]]:
        """
        쿼리 벡터 리스트에 대해 상위 top_k 검색 결과를 반환.
        """
        results = self._client.search(
            collection_name=POLICY_COLLECTION_NAME,
            data=list(query_embeddings),
            anns_field="embedding",
            limit=top_k,
            search_params={"metric_type": "COSINE", "params": {"nprobe": 16}},
            output_fields=["policy_id", "category", "source", "chunk_text"],
        )
        return results

