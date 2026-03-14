"""event_program builder."""

from __future__ import annotations

from collections import Counter, defaultdict
from datetime import datetime, time, timedelta
from typing import Any


class EventProgramBuilder:
    """Generate programs by category with same-event title uniqueness."""

    def __init__(self, context: Any) -> None:
        self.ctx = context
        self.pool = context.pools
        self.title_counter: Counter[str] = Counter()
        self.recent_titles: list[str] = []

    def build(self, events: list[dict[str, Any]], booths: list[dict[str, Any]]) -> list[dict[str, Any]]:
        booths_by_event: dict[int, list[dict[str, Any]]] = defaultdict(list)
        for booth in booths:
            booths_by_event[booth["event_id"]].append(booth)

        session_pool = self.pool.pools.get("session_titles_ko", [])
        contest_pool = self.pool.pools.get("contest_titles_ko", [])
        experience_pool = self.pool.pools.get("experience_titles_ko", [])
        if not session_pool or not contest_pool or not experience_pool:
            raise ValueError("program title pools are empty")

        rows: list[dict[str, Any]] = []
        programs_by_event: dict[int, list[int]] = defaultdict(list)
        scale_counts = {
            "L": {"SESSION": 19, "CONTEST": 10, "EXPERIENCE": 22},
            "M": {"SESSION": 13, "CONTEST": 7, "EXPERIENCE": 14},
            "S": {"SESSION": 9, "CONTEST": 4, "EXPERIENCE": 8},
        }

        for event in events:
            event_id = event["event_id"]
            scale = getattr(self.ctx, "event_scale_by_id", {}).get(event_id, "S")
            config_min = self.ctx.config["programs"]
            counts = scale_counts[scale].copy()
            counts["SESSION"] = max(counts["SESSION"], int(config_min["session_min_per_day"]))
            counts["CONTEST"] = max(counts["CONTEST"], int(config_min["contest_min_per_day"]))
            counts["EXPERIENCE"] = max(counts["EXPERIENCE"], int(config_min["experience_min_per_day"]))

            used_titles: set[str] = set()
            for category, count in counts.items():
                for idx in range(count):
                    title = self._pick_title(
                        category=category,
                        used_titles=used_titles,
                        session_pool=session_pool,
                        contest_pool=contest_pool,
                        experience_pool=experience_pool,
                    )
                    start_at, end_at = self._pick_program_window(event, category, idx, scale)
                    booth_id = self._pick_booth_id(booths_by_event[event_id], category)
                    capacity = self._pick_capacity(category, scale)

                    program_id = self.ctx.next_id("event_program")
                    rows.append(
                        {
                            "program_id": program_id,
                            "event_id": event_id,
                            "category": category,
                            "program_title": title,
                            "description": f"{title} 프로그램입니다.",
                            "start_at": start_at,
                            "end_at": end_at,
                            "booth_id": booth_id,
                            "image_url": f"/images/programs/event_{event_id}/program_{program_id}.jpg",
                            "capacity": capacity,
                            "throughput_per_min": round(max(1, capacity / 120.0), 2),
                            "created_at": self.ctx.now,
                        }
                    )
                    programs_by_event[event_id].append(program_id)

        self.ctx.programs_by_event = programs_by_event
        return rows

    def _pick_title(
        self,
        category: str,
        used_titles: set[str],
        session_pool: list[str],
        contest_pool: list[str],
        experience_pool: list[str],
    ) -> str:
        if category == "SESSION":
            pool = session_pool
        elif category == "CONTEST":
            pool = contest_pool
        else:
            pool = experience_pool

        candidates = [t for t in pool if t not in used_titles]
        if not candidates:
            candidates = pool[:]
        ranked = sorted(
            candidates,
            key=lambda x: (self.title_counter[x], 1 if x in self.recent_titles else 0, self.ctx.rng.random()),
        )
        title = self.ctx.rng.choice(ranked[: max(10, len(ranked) // 4)])
        if title in used_titles:
            suffix = 2
            temp = f"{title} {suffix}"
            while temp in used_titles:
                suffix += 1
                temp = f"{title} {suffix}"
            title = temp

        used_titles.add(title)
        self.title_counter[title] += 1
        self.recent_titles.append(title)
        if len(self.recent_titles) > 120:
            self.recent_titles.pop(0)
        return title

    def _pick_program_window(
        self,
        event: dict[str, Any],
        category: str,
        index: int,
        scale: str,
    ) -> tuple[Any, Any]:
        start = event["start_at"]
        end = event["end_at"]
        total_days = max(1, (end.date() - start.date()).days + 1)
        day_offset = index % total_days

        # Longer 운영형 프로그램 시간으로 대규모 AI 시계열 모수를 확보한다.
        duration_map = {
            "SESSION": {"L": 300, "M": 270, "S": 240},
            "CONTEST": {"L": 270, "M": 240, "S": 210},
            "EXPERIENCE": {"L": 540, "M": 480, "S": 420},
        }
        duration_min = duration_map[category][scale]

        event_day = (start + timedelta(days=day_offset)).date()
        day_start = datetime.combine(event_day, time(hour=9, minute=0, second=0))
        day_end = datetime.combine(event_day, time(hour=18, minute=0, second=0))

        # Program must stay within both event range and daily operating hours.
        bounded_start = max(day_start, start)
        bounded_end = min(day_end, end)
        available_min = int((bounded_end - bounded_start).total_seconds() // 60)
        if available_min <= 0:
            return start, min(end, start + timedelta(minutes=30))

        effective_duration = min(duration_min, max(30, available_min))
        latest_start = bounded_end - timedelta(minutes=effective_duration)
        if latest_start < bounded_start:
            latest_start = bounded_start

        start_candidates: list[datetime] = []
        cursor = bounded_start
        while cursor <= latest_start:
            start_candidates.append(cursor)
            cursor += timedelta(minutes=30)
        if not start_candidates:
            start_candidates.append(bounded_start)

        start_at = self.ctx.rng.choice(start_candidates)
        end_at = start_at + timedelta(minutes=effective_duration)
        if end_at > bounded_end:
            end_at = bounded_end
        return start_at, end_at

    def _pick_booth_id(self, event_booths: list[dict[str, Any]], category: str) -> int | None:
        if not event_booths:
            return None
        if category == "SESSION":
            preferred = [b for b in event_booths if b["type"] in {"SESSION_ROOM", "STAGE", "BOOTH_INFO"}]
        elif category == "CONTEST":
            preferred = [b for b in event_booths if b["type"] in {"CONTEST_ZONE", "STAGE"}]
        else:
            preferred = [b for b in event_booths if b["type"] in {"BOOTH_EXPERIENCE", "BOOTH_COMPANY", "ETC"}]
        targets = preferred or event_booths
        return self.ctx.rng.choice(targets)["booth_id"]

    def _pick_capacity(self, category: str, scale: str) -> int:
        if category == "SESSION":
            return self.ctx.rng.randint(60, 160) if scale == "L" else self.ctx.rng.randint(40, 120)
        if category == "CONTEST":
            return self.ctx.rng.randint(40, 120) if scale == "L" else self.ctx.rng.randint(30, 80)
        return self.ctx.rng.randint(20, 80) if scale == "L" else self.ctx.rng.randint(15, 50)
