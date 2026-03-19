"""챗봇 서비스 계층.

기능:
- 대화 이력을 Bedrock 요청 형식으로 변환하고 답변 텍스트를 추출한다.

설명:
- 라우터는 이 모듈만 호출한다.
- 실제 모델 호출은 Bedrock runtime client를 통해 수행한다.
"""

import json

import boto3

from pupoo_ai.app.core.config import settings
from pupoo_ai.app.features.chatbot.dto.request import ChatRequest
from pupoo_ai.app.features.chatbot.prompts.system import SYSTEM_PROMPT


def get_bedrock_client():
    # 기능: Bedrock runtime client를 생성한다.
    # 설명: 설정에 정의된 AWS 리전을 기준으로 공통 클라이언트를 만든다.
    # 흐름: 설정 조회 -> boto3 client 생성 -> 반환.
    return boto3.client("bedrock-runtime", region_name=settings.aws_region)


async def chat(request: ChatRequest) -> str:
    # 기능: 챗봇 대화 이력을 Bedrock 요청 형식으로 변환해 답변을 생성한다.
    # 설명: 선행 assistant 메시지를 정리한 뒤 시스템 프롬프트와 함께 모델 호출을 수행한다.
    # 흐름: history 정리 -> messages 구성 -> Bedrock 호출 -> 응답 텍스트 추출.
    # Bedrock의 첫 메시지가 반드시 "user"여야 해서 선행 assistant 메시지는 제거한다.
    history = list(request.history)
    while history and history[0].role == "assistant":
        history.pop(0)

    messages = [{"role": message.role, "content": [{"text": message.content}]} for message in history]
    messages.append({"role": "user", "content": [{"text": request.message}]})

    body = json.dumps(
        {
            "messages": messages,
            "system": [{"text": SYSTEM_PROMPT}],
            "inferenceConfig": {
                "maxTokens": 1024,
                "temperature": 0.7,
            },
        }
    )

    response = get_bedrock_client().invoke_model(
        modelId=settings.bedrock_model_id,
        body=body,
        contentType="application/json",
        accept="application/json",
    )

    result = json.loads(response["body"].read())
    return result["output"]["message"]["content"][0]["text"]
