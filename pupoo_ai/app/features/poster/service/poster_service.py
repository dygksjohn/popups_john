from uuid import uuid4

from pupoo_ai.app.core.logger import get_logger
from pupoo_ai.app.features.poster.dto.poster_dto import (
    PosterGenerateRequest,
    PosterGenerateResult,
    PosterStatus,
)
from pupoo_ai.app.features.poster.inference.generator import PosterGenerator
from pupoo_ai.app.features.poster.prompts.poster_prompt import build_poster_prompt

logger = get_logger(__name__)


class PosterService:
    def __init__(self, generator: PosterGenerator | None = None) -> None:
        self.generator = generator or PosterGenerator()

    def generate_poster(self, request: PosterGenerateRequest) -> PosterGenerateResult:
        job_id = str(uuid4())
        prompt = build_poster_prompt(request)

        logger.info(
            "Generate poster request received: event_id=%s style=%s size=%s",
            request.event_id,
            request.style.value,
            request.size,
        )

        image_url = self.generator.generate(job_id=job_id, request=request, prompt=prompt)

        return PosterGenerateResult(
            job_id=job_id,
            event_id=request.event_id,
            status=PosterStatus.SUCCEEDED,
            image_url=image_url,
            prompt=prompt,
            size=request.size,
            quality=request.quality,
            background=request.background,
            output_format=request.output_format,
            output_compression=request.output_compression,
            error_message=None,
        )


poster_service = PosterService()
