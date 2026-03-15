"""모더레이션 API 요청/응답 스키마 (등록 시점 Level 3 RAG)."""
from pydantic import BaseModel, Field


class ModerateRequest(BaseModel):
    """POST /internal/moderate 요청."""
    text: str = Field(..., min_length=1, description="검사할 텍스트")
    board_id: int | None = Field(None, description="게시판 ID (선택)")
    content_type: str | None = Field(None, description="POST | COMMENT 등 (선택)")


class ModerateResponse(BaseModel):
    """모더레이션 응답."""
    action: str = Field(..., description="PASS | REVIEW | BLOCK")
    ai_score: float | None = Field(None, description="AI 판정 점수 또는 RAG 근거 관련 수치")
    reason: str | None = Field(None, description="사유 또는 RAG 근거")
    stack: str = Field("rag_watsonx", description="사용 스택 식별자 (rag_watsonx | rag_stub)")
