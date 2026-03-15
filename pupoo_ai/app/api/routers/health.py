from fastapi import APIRouter
from fastapi.responses import JSONResponse

from pupoo_ai.app.core.config import settings
from pupoo_ai.app.infrastructure.rds import check_connection, is_rds_configured

router = APIRouter(tags=["health"])


@router.get("/health")
async def health_check() -> dict[str, str]:
    return {"status": "ok", "service": settings.service_name}


@router.get("/ready")
async def readiness_check():
    payload = {
        "status": "ready",
        "model": settings.bedrock_model_id,
        "database": {
            "configured": False,
            "reachable": False,
        },
    }

    if not is_rds_configured():
        return payload

    try:
        payload["database"] = check_connection()
        return payload
    except Exception as exc:
        payload["status"] = "degraded"
        payload["database"] = {
            "configured": True,
            "reachable": False,
            "error": str(exc),
        }
        return JSONResponse(status_code=503, content=payload)
