from __future__ import annotations

import argparse
import json
import os
import re
from dataclasses import dataclass
from datetime import datetime
from decimal import Decimal
from pathlib import Path
from typing import Any

import joblib
import numpy as np
import pymysql
from sklearn.ensemble import HistGradientBoostingRegressor
from sklearn.metrics import mean_absolute_error, mean_squared_error

SEQUENCE_LENGTH = 60
SUPPORTED_TARGET_TYPES = ("EVENT", "PROGRAM")
MYSQL_JDBC_PATTERN = re.compile(
    r"^jdbc:mysql://(?P<host>[^:/?#]+)(?::(?P<port>\d+))?/(?P<database>[^?]+)"
)


@dataclass(frozen=True)
class DbConfig:
    host: str
    port: int
    user: str
    password: str
    database: str


def _project_root() -> Path:
    return Path(__file__).resolve().parents[4]


def _parse_jdbc_url(url: str | None) -> tuple[str, int, str] | None:
    if not url:
        return None
    match = MYSQL_JDBC_PATTERN.match(url.strip())
    if not match:
        return None
    host = match.group("host")
    port = int(match.group("port") or 3306)
    database = match.group("database")
    return host, port, database


def _resolve_db_config(args: argparse.Namespace) -> DbConfig:
    jdbc_url = args.db_url or os.getenv("PUPOO_AI_TRAIN_DB_URL") or os.getenv("SPRING_DATASOURCE_URL")
    parsed = _parse_jdbc_url(jdbc_url)

    default_host = "localhost"
    default_port = 3306
    default_database = "pupoodb"

    if parsed:
        default_host, default_port, default_database = parsed

    host = args.db_host or os.getenv("PUPOO_AI_TRAIN_DB_HOST") or default_host
    port = int(args.db_port or os.getenv("PUPOO_AI_TRAIN_DB_PORT") or default_port)
    user = args.db_user or os.getenv("PUPOO_AI_TRAIN_DB_USER") or os.getenv("SPRING_DATASOURCE_USERNAME") or "pupoo"
    password = (
        args.db_password
        or os.getenv("PUPOO_AI_TRAIN_DB_PASSWORD")
        or os.getenv("SPRING_DATASOURCE_PASSWORD")
        or "pupoo1234!"
    )
    database = args.db_name or os.getenv("PUPOO_AI_TRAIN_DB_NAME") or default_database

    return DbConfig(
        host=host,
        port=port,
        user=user,
        password=password,
        database=database,
    )


def _to_float(value: Any, default: float = 0.0) -> float:
    if value is None:
        return default
    if isinstance(value, (float, int)):
        return float(value)
    if isinstance(value, Decimal):
        return float(value)
    try:
        return float(value)
    except (TypeError, ValueError):
        return default


def _sanitize_sequence(raw_json: str) -> np.ndarray | None:
    try:
        payload = json.loads(raw_json)
    except json.JSONDecodeError:
        return None

    if not isinstance(payload, list) or len(payload) != SEQUENCE_LENGTH:
        return None

    try:
        sequence = np.asarray(payload, dtype=np.float32)
    except (TypeError, ValueError):
        return None

    if sequence.shape != (SEQUENCE_LENGTH,):
        return None

    sequence = np.nan_to_num(sequence, nan=0.0, posinf=100.0, neginf=0.0)
    sequence = np.clip(sequence, 0.0, 100.0)
    return sequence


def _fetch_training_rows(
    db_config: DbConfig,
    row_limit: int | None = None,
) -> tuple[dict[str, np.ndarray], dict[str, np.ndarray], dict[str, np.ndarray], dict[str, int]]:
    sequences: dict[str, list[np.ndarray]] = {target_type: [] for target_type in SUPPORTED_TARGET_TYPES}
    avg_targets: dict[str, list[float]] = {target_type: [] for target_type in SUPPORTED_TARGET_TYPES}
    peak_targets: dict[str, list[float]] = {target_type: [] for target_type in SUPPORTED_TARGET_TYPES}
    dropped_counts = {
        "invalid_target_type": 0,
        "invalid_sequence": 0,
        "invalid_label": 0,
    }

    sql = """
        SELECT target_type, input_sequence_json, target_avg_score_60m, target_peak_score_60m
        FROM ai_training_dataset
        WHERE JSON_LENGTH(input_sequence_json) = %s
        ORDER BY training_dataset_id
    """
    params: list[Any] = [SEQUENCE_LENGTH]
    if row_limit and row_limit > 0:
        sql += " LIMIT %s"
        params.append(row_limit)

    connection = pymysql.connect(
        host=db_config.host,
        port=db_config.port,
        user=db_config.user,
        password=db_config.password,
        database=db_config.database,
        charset="utf8mb4",
        cursorclass=pymysql.cursors.SSCursor,
        autocommit=True,
    )

    try:
        with connection.cursor() as cursor:
            cursor.execute(sql, params)
            while True:
                batch = cursor.fetchmany(2048)
                if not batch:
                    break

                for row in batch:
                    target_type = str(row[0]).upper() if row[0] else ""
                    if target_type not in SUPPORTED_TARGET_TYPES:
                        dropped_counts["invalid_target_type"] += 1
                        continue

                    sequence = _sanitize_sequence(row[1])
                    if sequence is None:
                        dropped_counts["invalid_sequence"] += 1
                        continue

                    target_avg = _to_float(row[2], default=-1.0)
                    target_peak = _to_float(row[3], default=-1.0)
                    if target_avg < 0.0 or target_peak < 0.0:
                        dropped_counts["invalid_label"] += 1
                        continue

                    avg_targets[target_type].append(float(np.clip(target_avg, 0.0, 100.0)))
                    peak_targets[target_type].append(float(np.clip(target_peak, 0.0, 100.0)))
                    sequences[target_type].append(sequence)
    finally:
        connection.close()

    sequence_arrays: dict[str, np.ndarray] = {}
    avg_arrays: dict[str, np.ndarray] = {}
    peak_arrays: dict[str, np.ndarray] = {}

    for target_type in SUPPORTED_TARGET_TYPES:
        if sequences[target_type]:
            sequence_arrays[target_type] = np.vstack(sequences[target_type]).astype(np.float32)
            avg_arrays[target_type] = np.asarray(avg_targets[target_type], dtype=np.float32)
            peak_arrays[target_type] = np.asarray(peak_targets[target_type], dtype=np.float32)
        else:
            sequence_arrays[target_type] = np.empty((0, SEQUENCE_LENGTH), dtype=np.float32)
            avg_arrays[target_type] = np.empty((0,), dtype=np.float32)
            peak_arrays[target_type] = np.empty((0,), dtype=np.float32)

    return sequence_arrays, avg_arrays, peak_arrays, dropped_counts


def _build_feature_matrix(sequence_matrix: np.ndarray) -> np.ndarray:
    if sequence_matrix.size == 0:
        return np.empty((0, SEQUENCE_LENGTH + 18), dtype=np.float32)

    n_rows, seq_len = sequence_matrix.shape
    assert seq_len == SEQUENCE_LENGTH

    raw = sequence_matrix
    seq_mean = raw.mean(axis=1, keepdims=True)
    seq_std = raw.std(axis=1, keepdims=True)
    seq_min = raw.min(axis=1, keepdims=True)
    seq_max = raw.max(axis=1, keepdims=True)
    seq_first = raw[:, :1]
    seq_last = raw[:, -1:]

    quantiles = np.percentile(raw, [25.0, 50.0, 75.0], axis=1).T.astype(np.float32)
    q25 = quantiles[:, 0:1]
    q50 = quantiles[:, 1:2]
    q75 = quantiles[:, 2:3]

    mean_last5 = raw[:, -5:].mean(axis=1, keepdims=True)
    mean_last10 = raw[:, -10:].mean(axis=1, keepdims=True)
    mean_last15 = raw[:, -15:].mean(axis=1, keepdims=True)
    std_last5 = raw[:, -5:].std(axis=1, keepdims=True)
    std_last10 = raw[:, -10:].std(axis=1, keepdims=True)
    min_last10 = raw[:, -10:].min(axis=1, keepdims=True)
    max_last10 = raw[:, -10:].max(axis=1, keepdims=True)

    delta_last_first = seq_last - seq_first

    x = np.arange(SEQUENCE_LENGTH, dtype=np.float32)
    x_centered = x - x.mean()
    denominator = float(np.sum(x_centered * x_centered))
    raw_centered = raw - seq_mean
    slope = (raw_centered @ x_centered.reshape(seq_len, 1)) / denominator

    engineered = np.concatenate(
        [
            seq_mean,
            seq_std,
            seq_min,
            seq_max,
            seq_first,
            seq_last,
            q25,
            q50,
            q75,
            mean_last5,
            mean_last10,
            mean_last15,
            std_last5,
            std_last10,
            min_last10,
            max_last10,
            delta_last_first,
            slope,
        ],
        axis=1,
    ).astype(np.float32)

    feature_matrix = np.concatenate([raw, engineered], axis=1).astype(np.float32)
    assert feature_matrix.shape[0] == n_rows
    return feature_matrix


def _train_single_target_model(
    X_train: np.ndarray,
    y_train: np.ndarray,
    random_seed: int,
) -> HistGradientBoostingRegressor:
    model = HistGradientBoostingRegressor(
        loss="squared_error",
        learning_rate=0.05,
        max_iter=180,
        max_depth=6,
        min_samples_leaf=40,
        l2_regularization=0.1,
        random_state=random_seed,
    )
    model.fit(X_train, y_train)
    return model


def _train_and_evaluate(
    target_type: str,
    sequence_matrix: np.ndarray,
    target_avg: np.ndarray,
    target_peak: np.ndarray,
    validation_ratio: float,
    random_seed: int,
) -> tuple[dict[str, Any], dict[str, Any]]:
    sample_count = sequence_matrix.shape[0]
    if sample_count < 2:
        raise ValueError(f"{target_type}: not enough samples ({sample_count})")

    feature_matrix = _build_feature_matrix(sequence_matrix)
    rng = np.random.default_rng(random_seed)
    indices = rng.permutation(sample_count)

    train_count = int(round(sample_count * (1.0 - validation_ratio)))
    train_count = min(max(train_count, 1), sample_count - 1)

    train_indices = indices[:train_count]
    valid_indices = indices[train_count:]

    X_train = feature_matrix[train_indices]
    X_valid = feature_matrix[valid_indices]

    seq_valid = sequence_matrix[valid_indices]

    y_avg_train = target_avg[train_indices]
    y_avg_valid = target_avg[valid_indices]
    y_peak_train = target_peak[train_indices]
    y_peak_valid = target_peak[valid_indices]

    model_avg = _train_single_target_model(X_train, y_avg_train, random_seed)
    model_peak = _train_single_target_model(X_train, y_peak_train, random_seed + 1)

    pred_avg = np.clip(model_avg.predict(X_valid), 0.0, 100.0)
    pred_peak = np.clip(model_peak.predict(X_valid), 0.0, 100.0)

    baseline_avg = seq_valid[:, -12:].mean(axis=1)
    baseline_peak = seq_valid.max(axis=1)

    metrics = {
        "sampleCount": int(sample_count),
        "trainCount": int(train_count),
        "validCount": int(sample_count - train_count),
        "featureCount": int(feature_matrix.shape[1]),
        "avgMae": float(mean_absolute_error(y_avg_valid, pred_avg)),
        "avgRmse": float(np.sqrt(mean_squared_error(y_avg_valid, pred_avg))),
        "peakMae": float(mean_absolute_error(y_peak_valid, pred_peak)),
        "peakRmse": float(np.sqrt(mean_squared_error(y_peak_valid, pred_peak))),
        "baselineAvgMae": float(mean_absolute_error(y_avg_valid, baseline_avg)),
        "baselineAvgRmse": float(np.sqrt(mean_squared_error(y_avg_valid, baseline_avg))),
        "baselinePeakMae": float(mean_absolute_error(y_peak_valid, baseline_peak)),
        "baselinePeakRmse": float(np.sqrt(mean_squared_error(y_peak_valid, baseline_peak))),
    }

    artifact_payload = {
        "targetType": target_type,
        "sequenceLength": SEQUENCE_LENGTH,
        "featureVersion": "sequence_plus_stats_v1",
        "trainedAt": datetime.now().isoformat(),
        "metrics": metrics,
        "modelAvg": model_avg,
        "modelPeak": model_peak,
    }
    return artifact_payload, metrics


def _save_outputs(
    output_dir: Path,
    artifacts: dict[str, dict[str, Any]],
    report: dict[str, Any],
) -> None:
    output_dir.mkdir(parents=True, exist_ok=True)

    for target_type, artifact_payload in artifacts.items():
        file_path = output_dir / f"{target_type.lower()}_congestion_model.joblib"
        joblib.dump(artifact_payload, file_path)

    timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
    latest_report_path = output_dir / "training_report_latest.json"
    timestamped_report_path = output_dir / f"training_report_{timestamp}.json"

    latest_report_path.write_text(
        json.dumps(report, ensure_ascii=False, indent=2),
        encoding="utf-8",
    )
    timestamped_report_path.write_text(
        json.dumps(report, ensure_ascii=False, indent=2),
        encoding="utf-8",
    )


def _build_argument_parser() -> argparse.ArgumentParser:
    parser = argparse.ArgumentParser(
        description="Preprocess ai_training_dataset and train congestion models."
    )
    parser.add_argument("--db-url", default=None, help="JDBC URL (e.g. jdbc:mysql://localhost:3306/pupoodb)")
    parser.add_argument("--db-host", default=None)
    parser.add_argument("--db-port", type=int, default=None)
    parser.add_argument("--db-user", default=None)
    parser.add_argument("--db-password", default=None)
    parser.add_argument("--db-name", default=None)
    parser.add_argument("--limit", type=int, default=0, help="Optional row limit for quick experiments.")
    parser.add_argument("--validation-ratio", type=float, default=0.2)
    parser.add_argument("--random-seed", type=int, default=42)
    parser.add_argument("--min-rows", type=int, default=1000)
    parser.add_argument(
        "--output-dir",
        default=str(_project_root() / "artifacts" / "congestion"),
        help="Output directory for trained model artifacts.",
    )
    return parser


def main() -> None:
    parser = _build_argument_parser()
    args = parser.parse_args()

    if not (0.05 <= args.validation_ratio <= 0.5):
        raise ValueError("--validation-ratio must be between 0.05 and 0.5")

    db_config = _resolve_db_config(args)
    output_dir = Path(args.output_dir).resolve()

    print("[train] loading rows from ai_training_dataset...")
    sequence_data, avg_data, peak_data, dropped_counts = _fetch_training_rows(
        db_config=db_config,
        row_limit=args.limit if args.limit > 0 else None,
    )

    report: dict[str, Any] = {
        "startedAt": datetime.now().isoformat(),
        "db": {
            "host": db_config.host,
            "port": db_config.port,
            "database": db_config.database,
            "user": db_config.user,
        },
        "options": {
            "limit": args.limit,
            "validationRatio": args.validation_ratio,
            "randomSeed": args.random_seed,
            "minRows": args.min_rows,
            "sequenceLength": SEQUENCE_LENGTH,
        },
        "droppedRows": dropped_counts,
        "targets": {},
    }

    trained_artifacts: dict[str, dict[str, Any]] = {}

    for target_type in SUPPORTED_TARGET_TYPES:
        sample_count = int(sequence_data[target_type].shape[0])
        print(f"[train] {target_type}: {sample_count} rows")

        if sample_count < args.min_rows:
            report["targets"][target_type] = {
                "trained": False,
                "reason": f"not enough rows ({sample_count} < {args.min_rows})",
            }
            continue

        artifact_payload, metrics = _train_and_evaluate(
            target_type=target_type,
            sequence_matrix=sequence_data[target_type],
            target_avg=avg_data[target_type],
            target_peak=peak_data[target_type],
            validation_ratio=args.validation_ratio,
            random_seed=args.random_seed,
        )
        trained_artifacts[target_type] = artifact_payload
        report["targets"][target_type] = {
            "trained": True,
            "metrics": metrics,
        }

    if not trained_artifacts:
        raise RuntimeError("No model trained. Check min_rows or dataset quality.")

    report["finishedAt"] = datetime.now().isoformat()
    _save_outputs(output_dir=output_dir, artifacts=trained_artifacts, report=report)

    print(f"[train] completed. output={output_dir}")
    for target_type, payload in trained_artifacts.items():
        metrics = payload["metrics"]
        print(
            f"[train] {target_type} avg_mae={metrics['avgMae']:.3f} peak_mae={metrics['peakMae']:.3f} "
            f"avg_rmse={metrics['avgRmse']:.3f} peak_rmse={metrics['peakRmse']:.3f}"
        )


if __name__ == "__main__":
    main()

