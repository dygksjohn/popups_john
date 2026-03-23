"""모더레이션 임베딩 서비스.

기능:
- 정책 검색(Milvus)에 쓰는 텍스트 임베딩을 IBM watsonx.ai Embeddings API로 생성한다.

설명:
- BGE-M3 / 별도 embedding-service는 사용하지 않는다.
- Milvus 컬렉션 벡터 차원은 `PUPOO_AI_WATSONX_EMBEDDING_DIM`과 선택한 모델 출력이 일치해야 한다.
  (모델 변경 시 컬렉션 재구축 필요)
"""

from __future__ import annotations

import logging
import threading
from typing import Iterable, List, Protocol

from pupoo_ai.app.core.config import settings
from pupoo_ai.app.features.moderation.watsonx_client import is_watsonx_embedding_configured

logger = logging.getLogger(__name__)

# watsonx API 배치 한도를 넘기지 않도록 나눔
_EMBED_BATCH_SIZE = 32


class EmbeddingService(Protocol):
    def embed_texts(self, texts: Iterable[str]) -> List[List[float]]:
        ...

    @property
    def dim(self) -> int:
        ...


class WatsonxEmbeddingService:
    """watsonx.ai foundation model 임베딩 (langchain_ibm.WatsonxEmbeddings)."""

    def __init__(self) -> None:
        if not is_watsonx_embedding_configured():
            raise RuntimeError(
                "watsonx 임베딩에 필요한 설정이 없습니다. "
                "PUPOO_AI_WATSONX_API_KEY, PUPOO_AI_WATSONX_URL, PUPOO_AI_WATSONX_PROJECT_ID, "
                "PUPOO_AI_WATSONX_EMBEDDING_MODEL_ID 를 설정하세요."
            )
        self._dim = settings.watsonx_embedding_dim
        self._client = None
        self._lock = threading.Lock()

    @property
    def dim(self) -> int:
        return self._dim

    def _get_watsonx(self):
        with self._lock:
            if self._client is None:
                from langchain_ibm import WatsonxEmbeddings

                self._client = WatsonxEmbeddings(
                    model_id=settings.watsonx_embedding_model_id.strip(),
                    url=settings.watsonx_url or "https://us-south.ml.cloud.ibm.com",
                    apikey=settings.watsonx_api_key,
                    project_id=settings.watsonx_project_id,
                )
            return self._client

    def embed_texts(self, texts: Iterable[str]) -> List[List[float]]:
        texts_list = [t if t is not None else "" for t in texts]
        if not texts_list:
            return []

        wx = self._get_watsonx()
        out: List[List[float]] = []
        for i in range(0, len(texts_list), _EMBED_BATCH_SIZE):
            batch = texts_list[i : i + _EMBED_BATCH_SIZE]
            out.extend(wx.embed_documents(batch))

        if out and len(out[0]) != self._dim:
            logger.warning(
                "임베딩 벡터 길이(%d)가 PUPOO_AI_WATSONX_EMBEDDING_DIM(%d)과 다릅니다. "
                "Milvus 스키마·설정을 모델에 맞게 조정하세요.",
                len(out[0]),
                self._dim,
            )
        return out


_service_lock = threading.Lock()
_service: WatsonxEmbeddingService | None = None


def get_embedding_service() -> EmbeddingService:
    global _service
    with _service_lock:
        if _service is None:
            _service = WatsonxEmbeddingService()
        return _service
