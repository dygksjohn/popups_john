import math
from datetime import date, datetime, timedelta

from pupoo_ai.app.core.config import settings
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
from pupoo_ai.app.features.congestion.inference.lightgbm_registry import LightGbmCongestionRegistry
from pupoo_ai.app.features.congestion.inference.lstm_baseline import estimate_lstm_avg_score

FIVE_MINUTES = timedelta(minutes=5)
DEFAULT_THRESHOLD = 75.0
MODEL_REGISTRY = LightGbmCongestionRegistry(
    model_dir=settings.congestion_model_dir or None,
    enabled=settings.congestion_model_enabled,
)
PLANNED_LOCATION_SCORE_MAP = {
    "서울": 100.0,
    "경기": 99.0,
    "인천": 98.0,
    "부산": 97.0,
    "대전": 96.0,
    "대구": 95.0,
    "광주": 94.0,
    "울산": 92.0,
    "세종": 90.0,
    "충청": 93.0,
    "강원": 89.0,
    "제주": 88.0,
}
_FIXED_SOLAR_HOLIDAYS = {
    (1, 1),   # New Year's Day
    (3, 1),   # Independence Movement Day
    (5, 5),   # Children's Day
    (6, 6),   # Memorial Day
    (8, 15),  # Liberation Day
    (10, 3),  # National Foundation Day
    (10, 9),  # Hangul Day
    (12, 25), # Christmas
}


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


def _is_korean_holiday(target_date: date) -> bool:
    if (target_date.month, target_date.day) in _FIXED_SOLAR_HOLIDAYS:
        return True
    try:
        import holidays

        return target_date in holidays.country_holidays("KR", years=[target_date.year])
    except Exception:
        return False


def _build_calendar_feature_vector(
    base_time: datetime,
    start_at: datetime | None,
    end_at: datetime | None,
) -> list[float]:
    weekday = int(base_time.weekday())  # Mon=0 ... Sun=6
    angle = (2.0 * math.pi * weekday) / 7.0
    weekday_sin = math.sin(angle)
    weekday_cos = math.cos(angle)
    is_weekend = 1.0 if weekday >= 5 else 0.0
    is_holiday = 1.0 if _is_korean_holiday(base_time.date()) else 0.0

    day_index_ratio = 0.0
    progress_ratio = 0.0
    if start_at and end_at and end_at >= start_at:
        total_days = max((end_at.date() - start_at.date()).days + 1, 1)
        day_index = min(max((base_time.date() - start_at.date()).days, 0), total_days - 1)
        day_index_ratio = 0.0 if total_days <= 1 else (day_index / float(total_days - 1))

        duration_seconds = max((end_at - start_at).total_seconds(), 1.0)
        elapsed_seconds = min(max((base_time - start_at).total_seconds(), 0.0), duration_seconds)
        progress_ratio = elapsed_seconds / duration_seconds

    return [
        round(float(weekday_sin), 6),
        round(float(weekday_cos), 6),
        float(is_weekend),
        float(is_holiday),
        round(float(day_index_ratio), 6),
        round(float(progress_ratio), 6),
    ]


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


def _resolve_probe_time_for_date(
    target_date: date,
    start_at: datetime,
    end_at: datetime,
) -> datetime:
    probe = datetime.combine(target_date, datetime.min.time()).replace(hour=13, minute=0)
    if probe < start_at:
        return start_at
    if probe > end_at:
        return end_at
    return probe


def _has_meaningful_variation(values: list[float], min_delta: float = 1.0) -> bool:
    if len(values) < 2:
        return False
    return (max(values) - min(values)) >= min_delta


def _planned_daily_heuristic_score(
    request: EventPredictionRequest,
    base_score: float,
    target_date: date,
) -> float:
    probe_time = _resolve_probe_time_for_date(target_date, request.eventStartAt, request.eventEndAt)
    calendar = _build_calendar_feature_vector(
        base_time=probe_time,
        start_at=request.eventStartAt,
        end_at=request.eventEndAt,
    )

    day_index_ratio = float(calendar[4])
    is_holiday = float(calendar[3]) > 0.5
    weekday = int(target_date.weekday())
    weekday_bias_map = (-2.8, -3.4, -2.4, 1.0, 3.6, 5.8, 4.6)
    weekday_bias = weekday_bias_map[weekday]
    phase_bonus = math.sin(day_index_ratio * math.pi) * 4.4
    holiday_bonus = 6.0 if is_holiday else 0.0
    demand_scale = 0.90 + (_clamp100(request.registrationForecastScore) / 100.0) * 1.10
    adjustment = (weekday_bias + phase_bonus + holiday_bonus) * demand_scale

    return _clamp_score(base_score + adjustment)


def _planned_calendar_influence_weight(
    request: EventPredictionRequest,
    has_model_variation: bool,
) -> float:
    duration_days = max((request.eventEndAt.date() - request.eventStartAt.date()).days + 1, 1)
    registration_factor = _clamp100(request.registrationForecastScore) / 100.0

    weight = 0.52 + (registration_factor * 0.15)
    if duration_days <= 4:
        weight += 0.08
    if not has_model_variation:
        weight += 0.12

    return max(0.45, min(0.75, weight))


def _build_planned_daily_base_scores(
    request: EventPredictionRequest,
    points: list[datetime],
    fallback_base_score: float,
) -> dict[date, float]:
    if not points:
        return {}

    unique_dates = sorted({point.date() for point in points})
    model_daily_scores: dict[date, float] = {}

    for target_date in unique_dates:
        probe_time = _resolve_probe_time_for_date(target_date, request.eventStartAt, request.eventEndAt)
        model_prediction = MODEL_REGISTRY.predict(
            "EVENT",
            request.inputSequence,
            calendar_features=_build_calendar_feature_vector(
                base_time=probe_time,
                start_at=request.eventStartAt,
                end_at=request.eventEndAt,
            ),
        )
        if model_prediction is not None:
            model_daily_scores[target_date] = _clamp_score(model_prediction.avg_score)

    heuristic_scores = {
        day: _planned_daily_heuristic_score(request, _clamp_score(fallback_base_score), day)
        for day in unique_dates
    }

    if model_daily_scores:
        ordered_model_scores = [model_daily_scores[day] for day in unique_dates if day in model_daily_scores]
        has_model_variation = _has_meaningful_variation(ordered_model_scores, min_delta=1.0)
        calendar_weight = _planned_calendar_influence_weight(request, has_model_variation)
        blended_scores: dict[date, float] = {}
        for day in unique_dates:
            model_score = model_daily_scores.get(day, _clamp_score(fallback_base_score))
            heuristic_score = heuristic_scores[day]
            blended_scores[day] = _clamp_score(
                (model_score * (1.0 - calendar_weight)) + (heuristic_score * calendar_weight)
            )
        return blended_scores

    return heuristic_scores


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


def _resolve_planned_location_score(location: str | None) -> float:
    if not location:
        return 94.0

    normalized = location.strip()
    for keyword, score in PLANNED_LOCATION_SCORE_MAP.items():
        if keyword in normalized:
            return score
    return 94.0


def _is_planned_forecast_request(request: EventPredictionRequest) -> bool:
    if request.baseTime >= request.eventStartAt:
        return False

    return (
        request.entryCount <= 0
        and request.checkoutCount <= 0
        and request.runningProgramCount <= 0
        and request.totalWaitCount <= 0
        and request.averageWaitMinutes <= 0.0
    )


def _planned_contextual_score(request: EventPredictionRequest) -> float:
    duration_hours = max((request.eventEndAt - request.eventStartAt).total_seconds() / 3600.0, 1.0)
    duration_days = max(duration_hours / 24.0, 0.5)

    registration_score = _clamp100(request.registrationForecastScore)
    apply_volume_score = _clamp100(_safe_div(float(request.activeApplyCount), 2000.0) * 100.0)
    capacity_score = _clamp100(_safe_div(float(request.capacityBaseline), 2000.0) * 100.0)
    program_scale_score = _clamp100(_safe_div(float(request.totalProgramCount), 60.0) * 100.0)
    if request.locationDemandScore > 0.0:
        location_score = _clamp100(request.locationDemandScore)
    else:
        location_score = _resolve_planned_location_score(request.eventLocation)

    weighted = (
        (0.36 * registration_score)
        + (0.20 * apply_volume_score)
        + (0.18 * capacity_score)
        + (0.11 * program_scale_score)
        + (0.15 * location_score)
    )
    duration_penalty = min(max((duration_days - 3.0) * 1.4, 0.0), 7.0)
    core_score = _clamp_score(weighted - duration_penalty)
    signal_score = _signal_blend_score(request)
    return _clamp_score((core_score * 0.70) + (signal_score * 0.30))


def _signal_blend_score(request: EventPredictionRequest) -> float:
    weighted = (
        (0.17 * _clamp100(request.applicationTrendScore))
        + (0.17 * _clamp100(request.applyConversionScore))
        + (0.12 * _clamp100(request.queueOperationScore))
        + (0.14 * _clamp100(request.zoneDensityScore))
        + (0.10 * _clamp100(request.stayTimeScore))
        + (0.11 * _clamp100(request.manualCongestionScore))
        + (0.06 * _clamp100(request.revisitScore))
        + (0.05 * _clamp100(request.voteHeatScore))
        + (0.08 * _clamp100(request.paymentIntentScore))
    )
    return _clamp_score(weighted)


def _event_runtime_context_score(request: EventPredictionRequest) -> float:
    weighted = (
        (0.12 * _clamp100(request.applicationTrendScore))
        + (0.18 * _clamp100(request.applyConversionScore))
        + (0.18 * _clamp100(request.queueOperationScore))
        + (0.20 * _clamp100(request.zoneDensityScore))
        + (0.10 * _clamp100(request.stayTimeScore))
        + (0.14 * _clamp100(request.manualCongestionScore))
        + (0.02 * _clamp100(request.revisitScore))
        + (0.02 * _clamp100(request.voteHeatScore))
        + (0.04 * _clamp100(request.paymentIntentScore))
    )
    return _clamp_score(weighted)


def _is_ongoing_request(request: EventPredictionRequest) -> bool:
    return request.eventStartAt <= request.baseTime <= request.eventEndAt


def _apply_event_context_calibration(
    request: EventPredictionRequest,
    avg_score: float,
    peak_score: float,
    timeline_base_score: float,
    lstm_avg_score: float | None,
) -> tuple[float, float, float, float | None]:
    if _is_planned_forecast_request(request):
        context_score = _planned_contextual_score(request)
        blend_weight = 0.35
    elif _is_ongoing_request(request):
        context_score = _event_runtime_context_score(request)
        blend_weight = 0.20
    else:
        context_score = _signal_blend_score(request)
        blend_weight = 0.12

    blended_avg = _clamp_score((avg_score * (1.0 - blend_weight)) + (context_score * blend_weight))
    peak_blend_weight = min(0.45, blend_weight * 0.85)
    blended_peak = _clamp_score(
        max(
            blended_avg,
            (peak_score * (1.0 - peak_blend_weight))
            + ((context_score + 8.0) * peak_blend_weight),
        )
    )
    timeline_weight = min(0.45, blend_weight + 0.05)
    blended_timeline = _clamp_score(
        (timeline_base_score * (1.0 - timeline_weight)) + (context_score * timeline_weight)
    )
    blended_lstm = None
    if lstm_avg_score is not None:
        blended_lstm = _clamp_score((lstm_avg_score * (1.0 - blend_weight)) + (context_score * blend_weight))

    return blended_avg, blended_peak, blended_timeline, blended_lstm


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
    daily_base_scores: dict[date, float] | None = None,
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
        point_base_score = base_score
        if daily_base_scores:
            point_base_score = _clamp_score(daily_base_scores.get(point_time.date(), base_score))
        score = _clamp_score((point_base_score * profile_multiplier) + wave + trend)
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
    model_prediction = MODEL_REGISTRY.predict(
        "EVENT",
        request.inputSequence,
        calendar_features=_build_calendar_feature_vector(
            base_time=request.baseTime,
            start_at=request.eventStartAt,
            end_at=request.eventEndAt,
        ),
    )
    lstm_avg_score = estimate_lstm_avg_score(request.inputSequence)

    if model_prediction is None:
        avg_score = _clamp_score(base_score)
        peak_score = _clamp_score(max(base_score, base_score + 6.0))
        timeline_base_score = avg_score
        confidence = _confidence_from_data(
            request.activeApplyCount + request.totalWaitCount + request.runningProgramCount * 10
        )
        fallback_used = True
    else:
        avg_score = _clamp_score(model_prediction.avg_score)
        peak_score = _clamp_score(max(model_prediction.peak_score, avg_score))
        timeline_base_score = avg_score
        confidence = model_prediction.confidence
        fallback_used = False

    avg_score, peak_score, timeline_base_score, lstm_avg_score = _apply_event_context_calibration(
        request=request,
        avg_score=avg_score,
        peak_score=peak_score,
        timeline_base_score=timeline_base_score,
        lstm_avg_score=lstm_avg_score,
    )
    daily_base_scores = (
        _build_planned_daily_base_scores(request, points, timeline_base_score)
        if _is_planned_forecast_request(request)
        else None
    )
    timeline = _build_timeline(
        points,
        timeline_base_score,
        wait_anchor,
        "EVENT",
        daily_base_scores=daily_base_scores,
    )
    waits = [point.waitMinutes for point in timeline] or [_to_wait_minutes(timeline_base_score)]

    return PredictionResult(
        targetType="EVENT",
        eventId=request.eventId,
        baseTime=request.baseTime,
        predictedAvgScore=avg_score,
        predictedPeakScore=peak_score,
        predictedLevel=_level_from_score(peak_score),
        predictedWaitMinutes=max(0, int(round(sum(waits) / len(waits)))),
        confidence=confidence,
        lstmPredictedAvgScore=lstm_avg_score,
        fallbackUsed=fallback_used,
        timeline=timeline,
    )


def predict_program(request: ProgramPredictionRequest) -> PredictionResult:
    horizon_start = max(request.baseTime, request.programStartAt)
    points = _build_time_points(horizon_start, request.programEndAt)
    base_score = _program_base_score(request)
    wait_anchor = _program_wait_anchor(request)
    model_prediction = MODEL_REGISTRY.predict(
        "PROGRAM",
        request.inputSequence,
        calendar_features=_build_calendar_feature_vector(
            base_time=request.baseTime,
            start_at=request.programStartAt,
            end_at=request.programEndAt,
        ),
    )
    timeline_base_score = base_score if model_prediction is None else _clamp_score(model_prediction.avg_score)
    timeline = _build_timeline(points, timeline_base_score, wait_anchor, "PROGRAM")

    scores = [point.score for point in timeline] or [timeline_base_score]
    waits = [point.waitMinutes for point in timeline] or [_to_wait_minutes(timeline_base_score)]
    if model_prediction is None:
        avg_score = _clamp_score(sum(scores) / len(scores))
        peak_score = _clamp_score(max(scores))
        confidence = _confidence_from_data(request.activeApplyCount + request.waitCount * 2)
        fallback_used = True
    else:
        avg_score = _clamp_score(model_prediction.avg_score)
        peak_score = _clamp_score(max(model_prediction.peak_score, avg_score))
        confidence = model_prediction.confidence
        fallback_used = False

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
        lstmPredictedAvgScore=None,
        fallbackUsed=fallback_used,
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
