import json

import boto3

from pupoo_ai.app.core.logger import get_logger
from pupoo_ai.app.features.chatbot.dto.request import ChatRequest
from pupoo_ai.app.features.chatbot.prompts.system import SYSTEM_PROMPT

logger = get_logger(__name__)

MODEL = "us.amazon.nova-lite-v1:0"

_client = boto3.client("bedrock-runtime", region_name="us-east-1")


async def chat(request: ChatRequest) -> str:
    # Bedrock은 첫 메시지가 반드시 "user"여야 함 → 선행 assistant 메시지 제거
    history = list(request.history)
    while history and history[0].role == "assistant":
        history.pop(0)

    messages = [{"role": m.role, "content": [{"text": m.content}]} for m in history]
    messages.append({"role": "user", "content": [{"text": request.message}]})

    body = json.dumps({
        "messages": messages,
        "system": [{"text": SYSTEM_PROMPT}],
        "inferenceConfig": {
            "maxTokens": 1024,
            "temperature": 0.7,
        },
    })

    response = _client.invoke_model(
        modelId=MODEL,
        body=body,
        contentType="application/json",
        accept="application/json",
    )

    result = json.loads(response["body"].read())
    return result["output"]["message"]["content"][0]["text"]
