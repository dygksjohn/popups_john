import math
from datetime import datetime, timedelta

from pupoo_ai.app.features.congestion.dto.prediction_models import (
    EventPredictionRequest,
    PredictionResult,
    ProgramPredictionRequest,
    ProgramRecommendationRequest,
    RecommendationItem,
    RecommendationProgramInput,
    RecommendationResult,
    TimelinePoint,
)

FIVE_MINUTES = timedelta(minutes=5)
DEFAULT_THRESHOLD = 75.0


def _clamp_score(value: float) -> float:
    return round(max(0.0, min(100.0, value)), 1)


def _level_from_score(score: float) -> int:
    if score <= 24.0:
        return 1
    if score <= 49.0:
        return 2
    if score <= 74.0:
        return 3
    return 4


def _to_wait_minutes(score: float) -> int:
    return max(0, int(round(score * 0.35)))


def _align_to_five_minutes(value: datetime) -> datetime:
    minute_block = (value.minute // 5) * 5
    return value.replace(minute=minute_block, second=0, microsecond=0)


def _build_time_points(start_at: datetime, end_at: datetime) -> list[datetime]:
    if end_at < start_at:
        return []

    points: list[datetime] = []
    current = _align_to_five_minutes(start_at)
    if current < start_at:
        current += FIVE_MINUTES

    while current <= end_at:
        points.append(current)
        current += FIVE_MINUTES

    if not points or points[-1] < end_at:
        points.append(end_at.replace(second=0, microsecond=0))

    return points


def _event_base_score(request: EventPredictionRequest) -> float:
    total_apply = max(request.activeApplyCount, 1)
    running_programs = max(request.runningProgramCount, 0)
    total_programs = max(request.totalProgramCount, 1)

    entry_rate = request.entryCount / total_apply
    wait_rate = request.totalWaitCount / total_apply
    wait_time_rate = min(request.averageWaitMinutes / 20.0, 1.5)
    program_operation_rate = running_programs / total_programs
    wait_density_rate = min((request.totalWaitCount / max(running_programs, 1)) / 15.0, 1.5)

    # Re-estimated from ai_event_congestion_timeseries (2026-03-11, constrained no-bias fit)
    unit_score = (
        (entry_rate * 0.1022)
        + (wait_rate * 0.0000)
        + (wait_time_rate * 0.0266)
        + (wait_density_rate * 0.2616)
        - (program_operation_rate * 0.0000)
    )

    return _clamp_score(max(0.0, min(1.0, unit_score)) * 100.0)


def _program_base_score(request: ProgramPredictionRequest) -> float:
    total_apply = max(request.activeApplyCount, 1)
    checkin_rate = request.checkinCount / total_apply
    wait_rate = request.waitCount / total_apply
    wait_time_rate = min(request.waitMinutes / 15.0, 1.5)

    # Re-estimated from ai_program_congestion_timeseries (2026-03-11, constrained no-bias fit)
    unit_score = (
        (checkin_rate * 0.1417)
        + (wait_rate * 0.4864)
        + (wait_time_rate * 0.0157)
    )
    return _clamp_score(max(0.0, min(1.0, unit_score)) * 100.0)


def _confidence_from_data(volume: float) -> float:
    confidence = 0.55 + min(volume / 500.0, 0.35)
    return round(max(0.5, min(0.95, confidence)), 2)


def _build_timeline(points: list[datetime], base_score: float) -> list[TimelinePoint]:
    if not points:
        return []

    result: list[TimelinePoint] = []
    denominator = max(1, len(points) - 1)

    for index, point_time in enumerate(points):
        progress = index / denominator
        wave = math.sin(progress * math.pi * 2.0) * 5.5
        trend = (progress - 0.5) * 7.0
        score = _clamp_score(base_score + wave + trend)
        result.append(
            TimelinePoint(
                time=point_time,
                score=score,
                level=_level_from_score(score),
                waitMinutes=_to_wait_minutes(score),
            )
        )

    return result


def predict_event(request: EventPredictionRequest) -> PredictionResult:
    points = _build_time_points(request.eventStartAt, request.eventEndAt)
    base_score = _event_base_score(request)
    timeline = _build_timeline(points, base_score)

    scores = [point.score for point in timeline] or [base_score]
    avg_score = _clamp_score(sum(scores) / len(scores))
    peak_score = _clamp_score(max(scores))
    confidence = _confidence_from_data(
        request.activeApplyCount + request.totalWaitCount + request.runningProgramCount * 10
    )

    return PredictionResult(
        targetType="EVENT",
        eventId=request.eventId,
        baseTime=request.baseTime,
        predictedAvgScore=avg_score,
        predictedPeakScore=peak_score,
        predictedLevel=_level_from_score(peak_score),
        predictedWaitMinutes=_to_wait_minutes(avg_score),
        confidence=confidence,
        fallbackUsed=False,
        timeline=timeline,
    )


def predict_program(request: ProgramPredictionRequest) -> PredictionResult:
    horizon_start = max(request.baseTime, request.programStartAt)
    points = _build_time_points(horizon_start, request.programEndAt)
    base_score = _program_base_score(request)
    timeline = _build_timeline(points, base_score)

    scores = [point.score for point in timeline] or [base_score]
    avg_score = _clamp_score(sum(scores) / len(scores))
    peak_score = _clamp_score(max(scores))
    confidence = _confidence_from_data(request.activeApplyCount + request.waitCount * 2)

    return PredictionResult(
        targetType="PROGRAM",
        eventId=request.eventId,
        programId=request.programId,
        baseTime=request.baseTime,
        predictedAvgScore=avg_score,
        predictedPeakScore=peak_score,
        predictedLevel=_level_from_score(peak_score),
        predictedWaitMinutes=_to_wait_minutes(avg_score),
        confidence=confidence,
        fallbackUsed=False,
        timeline=timeline,
    )


def _recommendation_sort_key(
    candidate: RecommendationProgramInput,
    current: RecommendationProgramInput,
    base_time: datetime,
) -> tuple:
    same_category = int((candidate.category or "").upper() == (current.category or "").upper())
    time_fit = int(
        (base_time <= candidate.startAt <= base_time + timedelta(minutes=30))
        or (candidate.startAt <= base_time <= candidate.endAt)
    )
    same_target = int((candidate.target or "").upper() == (current.target or "").upper())
    same_zone = int((candidate.zone or "").upper() == (current.zone or "").upper())
    return (
        -same_category,
        -time_fit,
        -same_target,
        -same_zone,
        candidate.predictedScore,
        candidate.predictedWaitMinutes,
        candidate.startAt,
    )


def _build_recommend_reason(candidate: RecommendationProgramInput, current: RecommendationProgramInput) -> str:
    reasons: list[str] = []
    if (candidate.category or "").upper() == (current.category or "").upper():
        reasons.append("동일 카테고리")
    if (candidate.zone or "").upper() == (current.zone or "").upper():
        reasons.append("동일 구역")
    reasons.append("혼잡도 낮음")
    return ", ".join(reasons)


def recommend_programs(request: ProgramRecommendationRequest) -> RecommendationResult:
    threshold = request.thresholdScore or DEFAULT_THRESHOLD
    current = request.currentProgram

    if current.predictedScore < threshold:
        return RecommendationResult(
            eventId=request.eventId,
            programId=request.programId,
            thresholdScore=threshold,
            fallbackUsed=False,
            message="혼잡도가 임계치 미만입니다.",
            recommendations=[],
        )

    filtered = [
        candidate
        for candidate in request.candidates
        if candidate.programId != current.programId
        and candidate.endAt > request.baseTime + timedelta(minutes=5)
        and candidate.predictedScore < current.predictedScore
        and candidate.predictedScore < threshold
    ]
    ranked = sorted(
        filtered,
        key=lambda candidate: _recommendation_sort_key(candidate, current, request.baseTime),
    )

    top = ranked[:3]
    if not top:
        return RecommendationResult(
            eventId=request.eventId,
            programId=request.programId,
            thresholdScore=threshold,
            fallbackUsed=False,
            message=f"추천 후보가 없습니다. 예상 대기시간 {current.predictedWaitMinutes}분",
            recommendations=[],
        )

    items = [
        RecommendationItem(
            programId=candidate.programId,
            eventId=candidate.eventId,
            title=candidate.title,
            category=candidate.category,
            target=candidate.target,
            zone=candidate.zone,
            startAt=candidate.startAt,
            endAt=candidate.endAt,
            predictedScore=_clamp_score(candidate.predictedScore),
            predictedLevel=_level_from_score(candidate.predictedScore),
            predictedWaitMinutes=max(0, candidate.predictedWaitMinutes),
            reason=_build_recommend_reason(candidate, current),
        )
        for candidate in top
    ]

    return RecommendationResult(
        eventId=request.eventId,
        programId=request.programId,
        thresholdScore=threshold,
        fallbackUsed=False,
        message="대체 프로그램 추천 결과입니다.",
        recommendations=items,
    )
