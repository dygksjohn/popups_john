from fastapi import APIRouter, Depends

from pupoo_ai.app.core.auth import verify_internal_token
from pupoo_ai.app.core.constants import INTERNAL_API_PREFIX
from pupoo_ai.app.core.responses import success_response
from pupoo_ai.app.features.congestion.dto.prediction_models import (
    EventPredictionRequest,
    ProgramPredictionRequest,
    ProgramRecommendationRequest,
)
from pupoo_ai.app.features.congestion.service.prediction_service import (
    predict_event,
    predict_program,
    recommend_programs,
)

router = APIRouter(tags=["congestion"])


@router.post(f"{INTERNAL_API_PREFIX}/congestion/events/predict")
async def predict_event_congestion(
    request: EventPredictionRequest,
    _: None = Depends(verify_internal_token),
):
    result = predict_event(request)
    return success_response(result.model_dump(mode="json"))


@router.post(f"{INTERNAL_API_PREFIX}/congestion/programs/predict")
async def predict_program_congestion(
    request: ProgramPredictionRequest,
    _: None = Depends(verify_internal_token),
):
    result = predict_program(request)
    return success_response(result.model_dump(mode="json"))


@router.post(f"{INTERNAL_API_PREFIX}/congestion/programs/recommendations")
async def recommend_program_congestion(
    request: ProgramRecommendationRequest,
    _: None = Depends(verify_internal_token),
):
    result = recommend_programs(request)
    return success_response(result.model_dump(mode="json"))
