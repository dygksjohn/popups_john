"""모더레이션 임베딩 서비스 선택기.

기능:
- 정책 검색에 사용할 임베딩 구현체를 선택한다.

설명:
- watsonx, BGE-M3, stub 구현을 지원한다.
- stub은 개발/테스트용이며 실제 정책 품질을 보장하지 않는다.
"""

from __future__ import annotations

from typing import Iterable, List, Protocol

import httpx

from pupoo_ai.app.core.config import settings


class EmbeddingService(Protocol):
    def embed_texts(self, texts: Iterable[str]) -> List[List[float]]:
        ...

    @property
    def dim(self) -> int:
        ...


class RemoteBgeM3EmbeddingService:
    """
    BGE-M3 임베딩을 embedding-service(별도 FastAPI 앱)로 위임한다.
    - pupoo_ai 런타임에서 무거운 모델(torch/sentence-transformers) 의존성을 제거하기 위한 구조.
    """

    def __init__(self) -> None:
        backend = getattr(settings, "embedding_backend", "").lower()
        if backend != "bge-m3":
            raise RuntimeError(
                f"embedding_backend는 'bge-m3'로 고정되어야 합니다. 현재 값: {backend!r}"
            )
        if not settings.embedding_service_url:
            raise RuntimeError("PUPOO_AI_EMBEDDING_SERVICE_URL is required")

        self._base_url = settings.embedding_service_url.rstrip("/")
        self._timeout = settings.embedding_service_timeout_seconds
        self._dim = 1024

    @property
    def dim(self) -> int:
        return self._dim

    def embed_texts(self, texts: Iterable[str]) -> List[List[float]]:
        texts_list = list(texts)
        if not texts_list:
            return []

        headers = {"X-Internal-Token": settings.internal_token}
        payload = {"texts": [t if t is not None else "" for t in texts_list]}

        with httpx.Client(timeout=self._timeout) as client:
            r = client.post(f"{self._base_url}/internal/embed", json=payload, headers=headers)
            r.raise_for_status()
            data = r.json()

        vectors = data.get("vectors")
        if not isinstance(vectors, list):
            raise RuntimeError("Invalid embedding-service response: vectors")
        return vectors


def get_embedding_service() -> EmbeddingService:
    return RemoteBgeM3EmbeddingService()

