from pydantic import BaseModel, Field


class ChatAction(BaseModel):
    type: str
    payload: dict = Field(default_factory=dict)


class ChatResponse(BaseModel):
    message: str
    message_type: str = Field(default="default", alias="messageType")
    actions: list[ChatAction] = Field(default_factory=list)
