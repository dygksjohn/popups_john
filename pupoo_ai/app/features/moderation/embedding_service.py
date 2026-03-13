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


def get_embedding_service() -> Union[WatsonxEmbeddingService, StubEmbeddingService]:
    """watsonx 설정이 있으면 WatsonxEmbeddingService, 없으면 StubEmbeddingService 반환."""
    if is_watsonx_configured():
        return WatsonxEmbeddingService()
    return StubEmbeddingService(dim=128)

