"""AI program-level congestion timeseries builder."""

from __future__ import annotations

import math
from collections import Counter, defaultdict
from datetime import datetime, timedelta
from typing import Any


class AiProgramTimeseriesBuilder:
    """Build sequential program-level rows within real program time ranges."""

    def __init__(self, context: Any) -> None:
        self.ctx = context

    def build(self, operational_data: dict[str, list[dict[str, Any]]]) -> list[dict[str, Any]]:
        events = operational_data.get("event", [])
        programs = operational_data.get("event_program", [])
        program_applies = operational_data.get("event_program_apply", [])
        experience_waits = operational_data.get("experience_waits", [])
        qr_codes = operational_data.get("qr_codes", [])
        qr_logs = operational_data.get("qr_logs", [])
        congestions = operational_data.get("congestions", [])

        event_map = {row["event_id"]: row for row in events}
        interval = self.ctx.interval_minutes
        op_hours = self.ctx.config.get("ai", {}).get("program_operation_hours", {})
        start_hour = int(op_hours.get("start_hour", 0))
        end_hour = int(op_hours.get("end_hour", 23))

        # Keep requested default interval but tighten granularity when row volume is
        # clearly below scale target.
        target_min = int(self.ctx.table_target("ai_program_congestion_timeseries")["min"])
        estimated = self._estimate_rows(programs, event_map, interval, start_hour, end_hour)
        if estimated < target_min and interval > 1:
            interval = 1

        apply_count_by_program = Counter(
            row["program_id"] for row in program_applies if row.get("status") in {"APPLIED", "WAITING", "APPROVED"}
        )
        status_count_by_program: dict[int, Counter[str]] = defaultdict(Counter)
        for row in program_applies:
            status_count_by_program[row["program_id"]][row["status"]] += 1

        wait_by_program = {row["program_id"]: int(row.get("wait_count") or 0) for row in experience_waits}
        wait_min_by_program = {row["program_id"]: int(row.get("wait_min") or 0) for row in experience_waits}

        congestion_level_by_program: dict[int, list[int]] = defaultdict(list)
        for row in congestions:
            congestion_level_by_program[row["program_id"]].append(int(row.get("congestion_level") or 0))

        qr_event_map = {row["qr_id"]: row["event_id"] for row in qr_codes}
        checkin_by_booth_ts: Counter[tuple[int, datetime]] = Counter()
        checkout_by_booth_ts: Counter[tuple[int, datetime]] = Counter()
        checkin_by_event_ts: Counter[tuple[int, datetime]] = Counter()
        checkout_by_event_ts: Counter[tuple[int, datetime]] = Counter()
        for row in qr_logs:
            checked_at = self._as_dt(row["checked_at"])
            bucket = self._floor_to_interval(checked_at, interval)
            booth_id = row["booth_id"]
            event_id = qr_event_map.get(row["qr_id"])
            if row.get("check_type") == "CHECKIN":
                checkin_by_booth_ts[(booth_id, bucket)] += 1
                if event_id is not None:
                    checkin_by_event_ts[(event_id, bucket)] += 1
            else:
                checkout_by_booth_ts[(booth_id, bucket)] += 1
                if event_id is not None:
                    checkout_by_event_ts[(event_id, bucket)] += 1

        rows: list[dict[str, Any]] = []
        next_id = 1
        for program in programs:
            event = event_map.get(program["event_id"])
            if event is None or event["status"] == "PLANNED":
                continue

            start_at = self._as_dt(program["start_at"])
            end_at = self._as_dt(program["end_at"])
            if end_at <= start_at:
                continue

            program_id = program["program_id"]
            active_apply_base = max(1, apply_count_by_program.get(program_id, int(program.get("capacity") or 30)))
            wait_base = wait_by_program.get(program_id, 0)
            wait_min_base = wait_min_by_program.get(program_id, max(0, wait_base // 2))
            status_counter = status_count_by_program.get(program_id, Counter())
            checked_in_base = status_counter.get("CHECKED_IN", 0)
            waiting_base = status_counter.get("WAITING", 0)
            approved_base = status_counter.get("APPROVED", 0)
            congestion_base = (
                sum(congestion_level_by_program[program_id]) / len(congestion_level_by_program[program_id])
                if congestion_level_by_program[program_id]
                else 0.0
            )

            total_minutes = max(1, int((end_at - start_at).total_seconds() // 60))
            ts = self._floor_to_interval(start_at, interval)
            if ts < start_at:
                ts += timedelta(minutes=interval)

            while ts <= end_at:
                if ts.hour < start_hour or ts.hour > end_hour:
                    ts += timedelta(minutes=interval)
                    continue
                elapsed_min = max(0, int((ts - start_at).total_seconds() // 60))
                progress_ratio = min(1.0, elapsed_min / total_minutes)
                cat_factor = self._category_factor(program["category"], progress_ratio)

                booth_id = program.get("booth_id")
                checkins = 0
                checkouts = 0
                if booth_id is not None:
                    checkins = checkin_by_booth_ts.get((booth_id, ts), 0)
                    checkouts = checkout_by_booth_ts.get((booth_id, ts), 0)
                if checkins == 0:
                    checkins = checkin_by_event_ts.get((program["event_id"], ts), 0)
                if checkouts == 0:
                    checkouts = checkout_by_event_ts.get((program["event_id"], ts), 0)

                if checkins == 0:
                    checkins = int(max(0, active_apply_base * 0.018 * cat_factor + self.ctx.rng.uniform(-0.8, 1.8)))
                if checkouts == 0:
                    checkouts = int(max(0, active_apply_base * 0.015 * (cat_factor * 0.9) + self.ctx.rng.uniform(-0.8, 1.4)))

                if program["category"] == "EXPERIENCE":
                    wait_count = int(max(0, wait_base * (0.75 + cat_factor * 0.6) + waiting_base * 0.1 + self.ctx.rng.uniform(-2, 3)))
                    wait_min = int(max(0, wait_min_base * (0.70 + cat_factor * 0.45) + self.ctx.rng.uniform(-2, 3)))
                else:
                    wait_count = int(max(0, waiting_base * (0.25 + cat_factor * 0.5) + self.ctx.rng.uniform(-1.5, 2.2)))
                    wait_min = int(max(0, wait_count * self.ctx.rng.uniform(0.4, 0.95)))

                score = (
                    checkins * 1.9
                    + checkouts * 1.2
                    + wait_count * 0.22
                    + checked_in_base * 0.08
                    + approved_base * 0.03
                    + congestion_base * 1.8
                ) / 10.0

                rows.append(
                    {
                        "program_timeseries_id": next_id,
                        "event_id": program["event_id"],
                        "program_id": program_id,
                        "timestamp_minute": ts,
                        "checkins_1m": int(max(0, checkins)),
                        "checkouts_1m": int(max(0, checkouts)),
                        "active_apply_count": int(max(0, active_apply_base)),
                        "wait_count": int(max(0, wait_count)),
                        "wait_min": int(max(0, wait_min)),
                        "progress_minute": max(0, int((ts - self._as_dt(event["start_at"])).total_seconds() // 60)),
                        "hour_of_day": ts.hour,
                        "day_of_week": ts.isoweekday(),
                        "congestion_score": round(max(0.0, score), 2),
                        "created_at": self.ctx.now,
                        "updated_at": self.ctx.now,
                    }
                )
                next_id += 1
                ts += timedelta(minutes=interval)

        return rows

    def _estimate_rows(
        self,
        programs: list[dict[str, Any]],
        event_map: dict[int, dict[str, Any]],
        interval: int,
        start_hour: int,
        end_hour: int,
    ) -> int:
        total = 0
        for program in programs:
            event = event_map.get(program["event_id"])
            if event is None or event.get("status") == "PLANNED":
                continue
            start_at = self._as_dt(program["start_at"])
            end_at = self._as_dt(program["end_at"])
            if end_at <= start_at:
                continue
            cursor = self._floor_to_interval(start_at, interval)
            if cursor < start_at:
                cursor += timedelta(minutes=interval)
            while cursor <= end_at:
                if start_hour <= cursor.hour <= end_hour:
                    total += 1
                cursor += timedelta(minutes=interval)
        return total

    @staticmethod
    def _category_factor(category: str, progress_ratio: float) -> float:
        # SESSION: 시작 직전/초반 집중
        if category == "SESSION":
            if progress_ratio <= 0.25:
                return 1.0
            if progress_ratio <= 0.5:
                return 0.7
            return 0.35

        # CONTEST: 특정 시점 집중 (중반 피크)
        if category == "CONTEST":
            bell = math.exp(-((progress_ratio - 0.5) ** 2) / 0.03)
            return max(0.25, 0.25 + bell)

        # EXPERIENCE: 완만
        return max(0.35, 0.85 - (progress_ratio * 0.35))

    @staticmethod
    def _as_dt(value: Any) -> datetime:
        if isinstance(value, datetime):
            return value
        return datetime.fromisoformat(str(value).replace(" ", "T"))

    @staticmethod
    def _floor_to_interval(value: datetime, interval_minutes: int) -> datetime:
        minute = (value.minute // interval_minutes) * interval_minutes
        return value.replace(minute=minute, second=0, microsecond=0)
