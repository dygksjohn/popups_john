from fastapi import APIRouter

from pupoo_ai.app.core.config import settings

router = APIRouter(tags=["health"])


@router.get("/health")
async def health_check() -> dict[str, str]:
    return {"status": "ok", "service": settings.service_name}


@router.get("/ready")
async def readiness_check() -> dict[str, str]:
    return {"status": "ready", "model": settings.bedrock_model_id}
