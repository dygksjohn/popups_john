from fastapi import APIRouter, Depends

from pupoo_ai.app.core.auth import verify_internal_token
from pupoo_ai.app.core.constants import INTERNAL_API_PREFIX
from pupoo_ai.app.core.responses import success_response
from pupoo_ai.app.features.poster.dto.poster_dto import PosterGenerateRequest
from pupoo_ai.app.features.poster.service.poster_service import poster_service

router = APIRouter(
    prefix=f"{INTERNAL_API_PREFIX}/poster",
    tags=["poster"],
)


@router.post("/generate", dependencies=[Depends(verify_internal_token)])
async def generate_poster(request: PosterGenerateRequest):
    result = poster_service.generate_poster(request)
    return success_response(result.model_dump())
