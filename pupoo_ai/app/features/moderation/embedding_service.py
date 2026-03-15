from __future__ import annotations

from typing import Iterable, List, Protocol, Union

from pupoo_ai.app.core.config import settings

from .watsonx_client import WatsonxEmbeddingService, is_watsonx_configured


class EmbeddingService(Protocol):
    def embed_texts(self, texts: Iterable[str]) -> List[List[float]]:
        ...

    @property
    def dim(self) -> int:
        ...


class StubEmbeddingService:
    """
    watsonx 미설정 시 사용하는 스텁.
    - Milvus 파이프라인·검색 흐름 테스트용.
    """

    def __init__(self, dim: int = 128) -> None:
        self._dim = dim

    @property
    def dim(self) -> int:
        return self._dim

    def embed_texts(self, texts: Iterable[str]) -> List[List[float]]:
        vectors: List[List[float]] = []
        for t in texts:
            v = [0.0] * self._dim
            if not t:
                vectors.append(v)
                continue
            for i, ch in enumerate(t):
                v[i % self._dim] += (ord(ch) % 31) / 31.0
            vectors.append(v)
        return vectors


class BgeM3EmbeddingService:
    """
    BGE-M3 임베딩 백엔드.
    - 로컬에서 BAAI/bge-m3 모델을 사용해 1024차원 임베딩을 생성한다.
    - sentence-transformers 기반 구현을 사용한다.
    """

    def __init__(self) -> None:
        from sentence_transformers import SentenceTransformer

        self._model = SentenceTransformer("BAAI/bge-m3")
        self._dim = 1024

    @property
    def dim(self) -> int:
        return self._dim

    def embed_texts(self, texts: Iterable[str]) -> List[List[float]]:
        text_list = list(texts)
        if not text_list:
            return []
        emb = self._model.encode(text_list, batch_size=32, convert_to_numpy=True)
        return [vec.tolist() for vec in emb]


def get_embedding_service() -> Union[WatsonxEmbeddingService, BgeM3EmbeddingService, StubEmbeddingService]:
    """
    임베딩 서비스 선택 우선순위:
    1) settings.embedding_backend == "bge-m3" -> BGE-M3
    2) watsonx 설정이 존재 -> watsonx 임베딩
    3) 그 외 -> Stub (개발/테스트용)
    """
    backend = getattr(settings, "embedding_backend", "").lower()
    if backend == "bge-m3":
        return BgeM3EmbeddingService()
    if is_watsonx_configured():
        return WatsonxEmbeddingService()
    return StubEmbeddingService(dim=128)

