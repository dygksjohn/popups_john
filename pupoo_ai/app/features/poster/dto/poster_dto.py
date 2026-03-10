from enum import Enum

from pydantic import BaseModel, Field, model_validator


class PosterStyle(str, Enum):
    MODERN = "MODERN"
    FESTIVAL = "FESTIVAL"
    MINIMAL = "MINIMAL"
    PLAYFUL = "PLAYFUL"


class PosterStatus(str, Enum):
    PENDING = "PENDING"
    SUCCEEDED = "SUCCEEDED"
    FAILED = "FAILED"


class PosterQuality(str, Enum):
    LOW = "low"
    MEDIUM = "medium"
    HIGH = "high"
    AUTO = "auto"


class PosterBackground(str, Enum):
    AUTO = "auto"
    OPAQUE = "opaque"
    TRANSPARENT = "transparent"


class PosterOutputFormat(str, Enum):
    PNG = "png"
    JPEG = "jpeg"
    WEBP = "webp"


class PosterGenerateRequest(BaseModel):
    event_id: int = Field(gt=0)
    title: str = Field(min_length=1, max_length=120)
    date_text: str = Field(min_length=1, max_length=120)
    location: str = Field(min_length=1, max_length=120)
    summary: str = Field(min_length=1, max_length=1000)
    style: PosterStyle
    tone: str | None = Field(default=None, max_length=80)
    size: str = Field(default="1024x1536", pattern=r"^\d+x\d+$")
    quality: PosterQuality = PosterQuality.HIGH
    background: PosterBackground = PosterBackground.AUTO
    output_format: PosterOutputFormat = PosterOutputFormat.PNG
    output_compression: int | None = Field(default=None, ge=0, le=100)

    @model_validator(mode="after")
    def validate_output_options(self) -> "PosterGenerateRequest":
        if self.background == PosterBackground.TRANSPARENT and self.output_format == PosterOutputFormat.JPEG:
            raise ValueError("transparent background is not supported with jpeg output")
        return self


class PosterGenerateResult(BaseModel):
    job_id: str
    event_id: int
    status: PosterStatus
    image_url: str | None = None
    prompt: str
    size: str
    quality: PosterQuality
    background: PosterBackground
    output_format: PosterOutputFormat
    output_compression: int | None = None
    error_message: str | None = None
