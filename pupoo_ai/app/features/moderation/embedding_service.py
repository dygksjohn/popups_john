"""모더레이션 임베딩 서비스 선택기.

기능:
- 정책 검색에 사용할 임베딩 구현체를 선택한다.

설명:
- watsonx, BGE-M3, stub 구현을 지원한다.
- stub은 개발/테스트용이며 실제 정책 품질을 보장하지 않는다.
"""

from __future__ import annotations

from typing import Iterable, List, Protocol, Union

from pupoo_ai.app.core.config import settings
from pupoo_ai.app.features.moderation.watsonx_client import WatsonxEmbeddingService, is_watsonx_configured


class EmbeddingService(Protocol):
    def embed_texts(self, texts: Iterable[str]) -> List[List[float]]:
        ...

    @property
    def dim(self) -> int:
        ...


class StubEmbeddingService:
    """개발/테스트용 임베딩 대체 구현."""

    def __init__(self, dim: int = 128) -> None:
        self._dim = dim

    @property
    def dim(self) -> int:
        return self._dim

    def embed_texts(self, texts: Iterable[str]) -> List[List[float]]:
        # 기능: 문자열을 단순 해시 성격의 고정 길이 벡터로 변환한다.
        # 설명: 의미 기반 임베딩이 아니라 로컬 테스트를 위한 최소 구현이다.
        vectors: List[List[float]] = []
        for text in texts:
            vector = [0.0] * self._dim
            if not text:
                vectors.append(vector)
                continue
            for index, char in enumerate(text):
                vector[index % self._dim] += (ord(char) % 31) / 31.0
            vectors.append(vector)
        return vectors


class BgeM3EmbeddingService:
    """로컬 BGE-M3 임베딩 구현."""

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
        embeddings = self._model.encode(text_list, batch_size=32, convert_to_numpy=True)
        return [vector.tolist() for vector in embeddings]


def get_embedding_service() -> Union[WatsonxEmbeddingService, BgeM3EmbeddingService, StubEmbeddingService]:
    # 기능: 현재 설정에 맞는 임베딩 서비스를 반환한다.
    # 설명: 우선순위는 bge-m3 고정 선택 -> watsonx 사용 가능 -> 개발용 stub 순서다.
    backend = getattr(settings, "embedding_backend", "").lower()
    if backend == "bge-m3":
        return BgeM3EmbeddingService()
    if is_watsonx_configured():
        return WatsonxEmbeddingService()
    return StubEmbeddingService(dim=128)
