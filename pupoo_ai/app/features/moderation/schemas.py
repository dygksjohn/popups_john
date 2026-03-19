"""모더레이션 API 요청/응답 스키마.

기능:
- 백엔드와 AI 서비스 간 moderation 요청 구조를 고정한다.

설명:
- 이 스키마는 저장 전 사전 차단 판단에 사용된다.
- 신고 접수 후 관리자 승인 흐름과는 분리된 요청/응답 모델이다.
"""

from pydantic import BaseModel, Field


class ModerateRequest(BaseModel):
    """`POST /internal/moderate` 요청 모델."""

    text: str = Field(..., min_length=1, description="검사할 원문 텍스트")
    board_id: int | None = Field(None, description="게시판 ID")
    content_type: str | None = Field(None, description="POST 또는 COMMENT")


class ModerateResponse(BaseModel):
    """모더레이션 판단 결과 응답 모델."""

    action: str = Field(..., description="PASS 또는 BLOCK")
    ai_score: float | None = Field(None, description="AI 판단 점수")
    flagged_phrases: list[str] | None = Field(None, description="입력 원문에서 직접 발견된 문제 구문")
    inferred_phrases: list[str] | None = Field(None, description="정책/문맥 해석으로 도출한 위반 키워드")
    reason: str | None = Field(None, description="정책 판단 근거 요약")
    stack: str = Field("rag_watsonx", description="판단에 사용된 처리 스택")
