from pupoo_ai.app.core.config import settings
from pupoo_ai.app.core.logger import get_logger
from pupoo_ai.app.features.poster.dto.poster_dto import PosterGenerateRequest
from pupoo_ai.app.infrastructure.openai_client import OpenAIImageClient
from pupoo_ai.app.infrastructure.storage_client import LocalStorageClient

logger = get_logger(__name__)


class PosterGenerator:
    def __init__(
        self,
        openai_client: OpenAIImageClient | None = None,
        storage_client: LocalStorageClient | None = None,
    ) -> None:
        self.openai_client = openai_client or OpenAIImageClient()
        self.storage_client = storage_client or LocalStorageClient()

    def generate(self, *, job_id: str, request: PosterGenerateRequest, prompt: str) -> str:
        if settings.poster_use_mock_generation or not self.openai_client.is_configured():
            logger.info("Using mock poster generation: event_id=%s job_id=%s", request.event_id, job_id)
            return self._build_mock_url(job_id=job_id, request=request)

        image_bytes = self.openai_client.generate_image(
            prompt=prompt,
            size=request.size,
            quality=request.quality.value,
            background=request.background.value,
            output_format=request.output_format.value,
            output_compression=request.output_compression,
        )
        filename = f"event-{request.event_id}-{job_id}.{request.output_format.value}"
        return self.storage_client.save_poster(filename=filename, content=image_bytes)

    def _build_mock_url(self, *, job_id: str, request: PosterGenerateRequest) -> str:
        slug = f"event-{request.event_id}-{request.style.value.lower()}"
        return f"https://mock-storage.local/posters/{slug}-{job_id}-{request.size}.png"
