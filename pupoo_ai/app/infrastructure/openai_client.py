import base64

import httpx
from openai import OpenAI

from pupoo_ai.app.core.constants import ERROR_INTERNAL
from pupoo_ai.app.core.config import settings
from pupoo_ai.app.core.exceptions import ApiException
from pupoo_ai.app.core.logger import get_logger

logger = get_logger(__name__)


class OpenAIImageClient:
    def __init__(self, api_key: str | None = None, model: str | None = None) -> None:
        self.api_key = api_key or settings.openai_api_key
        self.model = model or settings.openai_image_model
        self.client = OpenAI(api_key=self.api_key) if self.api_key else None

    def is_configured(self) -> bool:
        return self.client is not None

    def generate_image(
        self,
        *,
        prompt: str,
        size: str,
        quality: str,
        background: str,
        output_format: str,
        output_compression: int | None,
    ) -> bytes:
        if self.client is None:
            raise ApiException(
                code=ERROR_INTERNAL,
                message="OpenAI API key is not configured.",
                status_code=500,
                errors=[],
            )

        logger.info("Generating OpenAI image: model=%s size=%s", self.model, size)

        try:
            request_options = {
                "model": self.model,
                "prompt": prompt,
                "size": size,
                "quality": quality,
                "background": background,
                "output_format": output_format,
            }
            if output_compression is not None and output_format in {"jpeg", "webp"}:
                request_options["output_compression"] = output_compression

            response = self.client.images.generate(**request_options)
            image = response.data[0]
        except Exception as exc:  # pragma: no cover
            logger.exception("OpenAI image generation failed: %s", exc)
            raise ApiException(
                code=ERROR_INTERNAL,
                message="Image generation failed.",
                status_code=500,
                errors=[],
            ) from exc

        if getattr(image, "b64_json", None):
            return base64.b64decode(image.b64_json)

        if getattr(image, "url", None):  # pragma: no cover
            download = httpx.get(image.url, timeout=60.0)
            download.raise_for_status()
            return download.content

        raise ApiException(
            code=ERROR_INTERNAL,
            message="Image generation did not return usable content.",
            status_code=500,
            errors=[],
        )
