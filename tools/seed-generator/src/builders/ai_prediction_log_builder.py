"""AI prediction log builder."""

from __future__ import annotations

from datetime import datetime, timedelta
from typing import Any


class AiPredictionLogBuilder:
    """Build ai_prediction_logs rows from training dataset rows."""

    def __init__(self, context: Any) -> None:
        self.ctx = context

    def build(self, training_rows: list[dict[str, Any]]) -> list[dict[str, Any]]:
        if not training_rows:
            return []

        target_spec = self.ctx.table_target("ai_prediction_logs")
        target_count = int(target_spec["target"])
        sample_count = min(target_count, len(training_rows))
        if sample_count <= 0:
            return []

        stride = max(1, len(training_rows) // sample_count)
        sampled = [row for idx, row in enumerate(training_rows) if idx % stride == 0][:sample_count]

        rows: list[dict[str, Any]] = []
        for idx, train_row in enumerate(sampled, start=1):
            base_timestamp = train_row["base_timestamp"]
            if not isinstance(base_timestamp, datetime):
                base_timestamp = datetime.fromisoformat(str(base_timestamp).replace(" ", "T"))

            base_avg = float(train_row["target_avg_score_60m"])
            base_peak = float(train_row["target_peak_score_60m"])
            pred_avg = round(max(0.0, base_avg * self.ctx.rng.uniform(0.88, 1.12)), 2)
            pred_peak = round(max(pred_avg, base_peak * self.ctx.rng.uniform(0.90, 1.15)), 2)

            rows.append(
                {
                    "prediction_log_id": idx,
                    "target_type": train_row["target_type"],
                    "event_id": train_row["event_id"],
                    "program_id": train_row["program_id"],
                    "prediction_base_time": base_timestamp,
                    "predicted_avg_score_60m": pred_avg,
                    "predicted_peak_score_60m": pred_peak,
                    "predicted_level": self._score_to_level(pred_peak),
                    "model_version": self.ctx.rng.choices(
                        ["v1.0.0", "v1.1.0", "v1.2.0"],
                        weights=[20, 55, 25],
                        k=1,
                    )[0],
                    "source_type": self.ctx.rng.choices(
                        ["BATCH", "REALTIME"],
                        weights=[38, 62],
                        k=1,
                    )[0],
                    "created_at": base_timestamp + timedelta(minutes=self.ctx.rng.randint(1, 60)),
                }
            )
        return rows

    @staticmethod
    def _score_to_level(score: float) -> int:
        if score < 10:
            return 1
        if score < 20:
            return 2
        if score < 35:
            return 3
        if score < 55:
            return 4
        return 5
