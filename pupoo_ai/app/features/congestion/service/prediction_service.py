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
    return round(_clamp100(value), 1)


def _safe_div(a: float, b: float) -> float:
    return 0.0 if b <= 0.0 else (a / b)


def _clamp01(value: float) -> float:
    return max(0.0, min(1.0, value))


def _clamp100(value: float) -> float:
    return max(0.0, min(100.0, value))


def _level_from_score(score: float) -> int:
    if score <= 20.0:
        return 1
    if score <= 40.0:
        return 2
    if score <= 60.0:
        return 3
    if score <= 80.0:
        return 4
    return 5


def _to_wait_minutes(score: float) -> int:
    # Human-facing wait conversion should be conservative for low congestion scores.
    normalized = max(0.0, min(100.0, score))
    if normalized < 25.0:
        return 0
    if normalized < 40.0:
        return max(1, int(round((normalized - 25.0) * 0.20 + 1.0)))
    if normalized < 55.0:
        return int(round(4.0 + (normalized - 40.0) * 0.33))
    if normalized < 70.0:
        return int(round(9.0 + (normalized - 55.0) * 0.47))
    if normalized < 85.0:
        return int(round(16.0 + (normalized - 70.0) * 0.67))
    return min(60, int(round(26.0 + (normalized - 85.0) * 0.95)))


def _time_profile_multiplier(point_time: datetime) -> float:
    hour = point_time.hour + (point_time.minute / 60.0)
    if hour < 10.0:
        return 0.85
    if hour < 12.0:
        return 1.00
    if hour < 14.0:
        return 0.92
    if hour < 16.0:
        return 1.10
    if hour < 18.0:
        return 1.00
    return 0.88


def _event_wait_anchor(request: EventPredictionRequest) -> float:
    if request.totalWaitCount <= 0 and request.averageWaitMinutes <= 0:
        return 0.0

    running_programs = max(request.runningProgramCount, 1)
    density_wait = request.totalWaitCount / running_programs
    entry_pressure = min(request.entryCount / max(request.activeApplyCount, 1), 1.2)
    anchor = (request.averageWaitMinutes * 0.65) + (density_wait * 0.35) + (entry_pressure * 1.2)

    if request.totalWaitCount <= 5 and request.averageWaitMinutes <= 2:
        return 0.0
    return max(0.0, min(120.0, anchor))


def _program_wait_anchor(request: ProgramPredictionRequest) -> float:
    if request.waitCount <= 0 and request.waitMinutes <= 0:
        return 0.0

    queue_wait = request.waitCount * 0.70
    checkin_pressure = min(request.checkinCount / max(request.activeApplyCount, 1), 1.2)
    anchor = (request.waitMinutes * 0.60) + (queue_wait * 0.40) + (checkin_pressure * 1.5)

    if request.waitCount <= 2 and request.waitMinutes <= 2 and checkin_pressure < 0.25:
        return 0.0
    return max(0.0, min(120.0, anchor))


def _point_wait_minutes(
    score: float,
    wait_anchor: float,
    profile_multiplier: float,
    target_type: str,
) -> int:
    score_wait = _to_wait_minutes(score)
    if wait_anchor <= 0.0:
        return score_wait

    profile_adjusted_anchor = wait_anchor * (0.90 + (profile_multiplier - 1.0) * 0.5)
    blend_anchor_weight = 0.70 if target_type == "PROGRAM" else 0.60
    blended_wait = (profile_adjusted_anchor * blend_anchor_weight) + (score_wait * (1.0 - blend_anchor_weight))
    return int(round(max(1.0, min(120.0, blended_wait))))


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
    net_entry_count = max(request.entryCount - request.checkoutCount, 0)
    running_programs = max(request.runningProgramCount, 0)
    total_programs = max(request.totalProgramCount, 1)

    capacity_baseline = max(request.capacityBaseline, 1)
    wait_baseline = max(request.waitBaseline, 1)
    target_wait_min = max(request.targetWaitMin, 1)

    wait_baseline_per_program = (
        float(wait_baseline)
        if running_programs <= 0
        else max(wait_baseline / max(running_programs, 1), 1.0)
    )

    entry_pressure = _clamp01(_safe_div(net_entry_count, max(capacity_baseline * 0.08, 1.0)))
    wait_pressure = _clamp01(_safe_div(request.totalWaitCount, max(wait_baseline, 1)))
    avg_wait_per_running_program = _safe_div(request.totalWaitCount, max(running_programs, 1))
    wait_density_pressure = _clamp01(_safe_div(avg_wait_per_running_program, max(wait_baseline_per_program, 1.0)))
    wait_time_pressure = _clamp01(_safe_div(request.averageWaitMinutes, max(target_wait_min, 1)))
    operation_relief = _clamp01(_safe_div(running_programs, max(total_programs, 1)))

    event_unit_score = (
        (0.22 * entry_pressure)
        + (0.30 * wait_pressure)
        + (0.23 * wait_density_pressure)
        + (0.30 * wait_time_pressure)
        - (0.05 * operation_relief)
    )

    live_score = event_unit_score * 100.0
    forecast_mode = (
        net_entry_count <= 0
        and running_programs <= 0
        and request.totalWaitCount <= 0
        and request.averageWaitMinutes <= 0
    )
    if forecast_mode:
        forecast_score = _planned_event_forecast_score(request)
        if forecast_score > 0.0:
            return forecast_score

    return _clamp_score(live_score)


def _planned_event_forecast_score(request: EventPredictionRequest) -> float:
    registration_score = _clamp100(request.registrationForecastScore)
    ongoing_baseline = _clamp100(request.ongoingBaselineScore)
    ended_baseline = _clamp100(request.endedBaselineScore)

    weighted_sum = 0.0
    total_weight = 0.0

    if registration_score > 0.0:
        weighted_sum += registration_score * 0.65
        total_weight += 0.65
    if ongoing_baseline > 0.0:
        weighted_sum += ongoing_baseline * 0.20
        total_weight += 0.20
    if ended_baseline > 0.0:
        weighted_sum += ended_baseline * 0.15
        total_weight += 0.15

    if total_weight <= 0.0:
        return 0.0

    blended = weighted_sum / total_weight
    bounded = max(5.0, min(90.0, blended))
    return _clamp_score(bounded)


def _program_base_score(request: ProgramPredictionRequest) -> float:
    program_capacity = max(request.programCapacity, 1)
    throughput_per_min = max(request.throughputPerMin, 1.0)
    target_wait_min = max(request.targetWaitMin, 1)

    checkin_pressure = _clamp01(_safe_div(request.checkinCount, max(throughput_per_min, 1.0)))
    queue_pressure = _clamp01(_safe_div(request.waitCount, max(program_capacity, 1)))
    wait_time_pressure = _clamp01(_safe_div(request.waitMinutes, max(target_wait_min, 1)))
    apply_backlog_pressure = _clamp01(_safe_div(request.activeApplyCount, max(program_capacity * 2.0, 1.0)))

    program_unit_score = (
        (0.20 * checkin_pressure)
        + (0.40 * queue_pressure)
        + (0.30 * wait_time_pressure)
        + (0.10 * apply_backlog_pressure)
    )
    return _clamp_score(program_unit_score * 100.0)


def _confidence_from_data(volume: float) -> float:
    confidence = 0.55 + min(volume / 500.0, 0.35)
    return round(max(0.5, min(0.95, confidence)), 2)


def _build_timeline(
    points: list[datetime],
    base_score: float,
    wait_anchor: float,
    target_type: str,
) -> list[TimelinePoint]:
    if not points:
        return []

    result: list[TimelinePoint] = []
    denominator = max(1, len(points) - 1)

    for index, point_time in enumerate(points):
        progress = index / denominator
        profile_multiplier = _time_profile_multiplier(point_time)
        wave = math.sin(progress * math.pi * 2.0) * 2.2
        trend = (progress - 0.5) * 3.0
        score = _clamp_score((base_score * profile_multiplier) + wave + trend)
        result.append(
            TimelinePoint(
                time=point_time,
                score=score,
                level=_level_from_score(score),
                waitMinutes=_point_wait_minutes(
                    score=score,
                    wait_anchor=wait_anchor,
                    profile_multiplier=profile_multiplier,
                    target_type=target_type,
                ),
            )
        )

    return result


def predict_event(request: EventPredictionRequest) -> PredictionResult:
    points = _build_time_points(request.eventStartAt, request.eventEndAt)
    base_score = _event_base_score(request)
    wait_anchor = _event_wait_anchor(request)
    timeline = _build_timeline(points, base_score, wait_anchor, "EVENT")

    scores = [point.score for point in timeline] or [base_score]
    waits = [point.waitMinutes for point in timeline] or [_to_wait_minutes(base_score)]
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
        predictedWaitMinutes=max(0, int(round(sum(waits) / len(waits)))),
        confidence=confidence,
        fallbackUsed=False,
        timeline=timeline,
    )


def predict_program(request: ProgramPredictionRequest) -> PredictionResult:
    horizon_start = max(request.baseTime, request.programStartAt)
    points = _build_time_points(horizon_start, request.programEndAt)
    base_score = _program_base_score(request)
    wait_anchor = _program_wait_anchor(request)
    timeline = _build_timeline(points, base_score, wait_anchor, "PROGRAM")

    scores = [point.score for point in timeline] or [base_score]
    waits = [point.waitMinutes for point in timeline] or [_to_wait_minutes(base_score)]
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
        predictedWaitMinutes=max(0, int(round(sum(waits) / len(waits)))),
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
