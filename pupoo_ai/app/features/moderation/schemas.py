"""모더레이션 API 요청/응답 스키마 (조합 6: HateBERT + Redis)."""
from pydantic import BaseModel, Field


class ModerateRequest(BaseModel):
    """POST /internal/moderate 요청."""
    text: str = Field(..., min_length=1, description="검사할 텍스트")
    board_id: int | None = Field(None, description="게시판 ID (선택)")
    content_type: str | None = Field(None, description="POST | COMMENT 등 (선택)")


class ModerateResponse(BaseModel):
    """모더레이션 응답."""
    action: str = Field(..., description="PASS | REVIEW | BLOCK")
    ai_score: float | None = Field(None, description="혐오/욕설 점수 0~1")
    reason: str | None = Field(None, description="사유")
    stack: str = Field("hatebert_redis", description="사용한 기술 조합 식별자")
