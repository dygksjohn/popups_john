from __future__ import annotations

import math
from decimal import Decimal
from typing import Any

SEQUENCE_LENGTH = 60
FORECAST_HORIZON = 12


def _clamp100(value: float) -> float:
    return max(0.0, min(100.0, value))


def _to_float(value: Any) -> float | None:
    if value is None:
        return None
    if isinstance(value, (int, float, Decimal)):
        return float(value)
    try:
        return float(value)
    except (TypeError, ValueError):
        return None


def _extract_score(item: Any) -> float | None:
    if isinstance(item, (int, float, Decimal)):
        return float(item)
    if isinstance(item, dict):
        for key in ("score", "congestion_score", "value", "v"):
            if key in item:
                return _to_float(item.get(key))
    return None


def _sanitize_sequence(input_sequence: list[Any] | None) -> list[float] | None:
    if not isinstance(input_sequence, list) or len(input_sequence) != SEQUENCE_LENGTH:
        return None

    values: list[float] = []
    for item in input_sequence:
        score = _extract_score(item)
        if score is None:
            return None
        values.append(_clamp100(score))
    return values


def _sigmoid(value: float) -> float:
    return 1.0 / (1.0 + math.exp(-value))


def estimate_lstm_avg_score(input_sequence: list[Any] | None) -> float | None:
    sequence = _sanitize_sequence(input_sequence)
    if sequence is None:
        return None

    # Lightweight LSTM-style baseline with fixed gates.
    h = 0.0
    c = 0.0
    normalized = [(value / 50.0) - 1.0 for value in sequence]
    for x in normalized:
        forget_gate = _sigmoid((0.95 * x) + (0.20 * h) + 0.20)
        input_gate = _sigmoid((0.80 * x) + (0.30 * h) - 0.10)
        output_gate = _sigmoid((0.90 * x) + (0.15 * h) - 0.15)
        candidate = math.tanh((0.85 * x) + (0.25 * h))
        c = (forget_gate * c) + (input_gate * candidate)
        h = output_gate * math.tanh(c)

    current_score = _clamp100((h + 1.0) * 50.0)
    slope = (sequence[-1] - sequence[-12]) / 11.0

    forecasts: list[float] = []
    rolling = current_score
    for _ in range(FORECAST_HORIZON):
        rolling = _clamp100((rolling * 0.88) + ((rolling + slope * 1.4) * 0.12))
        forecasts.append(rolling)

    if not forecasts:
        return round(current_score, 1)
    return round(sum(forecasts) / len(forecasts), 1)

