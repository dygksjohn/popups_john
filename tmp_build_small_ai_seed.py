from __future__ import annotations

import random
import sys
from pathlib import Path

BASE_DIR = Path(r"C:\pupoo_workspace\popups\tools\seed-generator")
CONFIG_PATH = BASE_DIR / "config" / "seed_config_ai_small.yaml"
OUTPUT_PATH = Path(r"C:\pupoo_workspace\popups\db\pupoo_ai_seed_v6.6_small.sql")

EVENT_TARGET = 2500
PROGRAM_TARGET = 2500

sys.path.insert(0, str(BASE_DIR))

from src.generator.orchestrator import AllModeOrchestrator
from src.loaders.config_loader import load_config
from src.loaders.data_pool_loader import DataPoolLoader
from src.writers.ai_sql_writer import AiSqlWriter


def _sample_rows(rows: list[dict], target: int, key_fields: tuple[str, ...], seed: int) -> list[dict]:
    if len(rows) <= target:
        return rows
    rng = random.Random(seed)
    sampled = rng.sample(rows, target)
    # deterministic order for cleaner diffs/import logs
    return sorted(sampled, key=lambda r: tuple(r.get(k) for k in key_fields))


def main() -> None:
    config = load_config(CONFIG_PATH)
    data_pool_loader = DataPoolLoader()
    data_pool_loader.load_named_pool(BASE_DIR / "data_pool")

    orchestrator = AllModeOrchestrator(config=config, data_pool_loader=data_pool_loader, base_dir=BASE_DIR)
    op_result, _, _ = orchestrator.run_operational()
    ai_result, _, _ = orchestrator.run_ai(op_result)
    data = ai_result.as_table_dict()

    data["ai_event_congestion_timeseries"] = _sample_rows(
        data["ai_event_congestion_timeseries"],
        EVENT_TARGET,
        ("event_id", "timestamp_minute"),
        seed=20260319,
    )
    data["ai_program_congestion_timeseries"] = _sample_rows(
        data["ai_program_congestion_timeseries"],
        PROGRAM_TARGET,
        ("program_id", "timestamp_minute"),
        seed=20260320,
    )

    AiSqlWriter().write(OUTPUT_PATH, data)
    print(f"written: {OUTPUT_PATH}")
    print(f"ai_event_congestion_timeseries={len(data['ai_event_congestion_timeseries'])}")
    print(f"ai_program_congestion_timeseries={len(data['ai_program_congestion_timeseries'])}")
    print(f"ai_training_dataset={len(data['ai_training_dataset'])}")
    print(f"ai_prediction_logs={len(data['ai_prediction_logs'])}")


if __name__ == "__main__":
    main()
