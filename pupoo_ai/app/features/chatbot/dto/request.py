from pydantic import BaseModel, Field


class MessageItem(BaseModel):
    role: str = Field(..., description="'user' 또는 'assistant'")
    content: str = Field(..., description="메시지 내용")


class ChatRequest(BaseModel):
    message: str = Field(..., min_length=1, max_length=2000, description="사용자 입력 메시지")
    history: list[MessageItem] = Field(
        default_factory=list,
        max_length=20,
        description="이전 대화 이력 (최대 20개)",
    )
