"""SQL writer for AI-only seed output."""

from __future__ import annotations

from datetime import date, datetime
from pathlib import Path
from typing import Any


TABLE_ORDER = [
    "ai_event_congestion_timeseries",
    "ai_program_congestion_timeseries",
    "ai_training_dataset",
    "ai_prediction_logs",
]

DELETE_ORDER = [
    "ai_prediction_logs",
    "ai_training_dataset",
    "ai_program_congestion_timeseries",
    "ai_event_congestion_timeseries",
]


class AiSqlWriter:
    """Render AI seed dictionary into executable SQL file."""

    def write(self, output_path: Path, data: dict[str, list[Any]]) -> None:
        lines: list[str] = [
            "SET SQL_SAFE_UPDATES = 0;",
            "SET FOREIGN_KEY_CHECKS = 0;",
            "",
        ]
        for table in DELETE_ORDER:
            lines.append(f"DELETE FROM {table};")
        lines.append("")
        lines.extend(self._build_insert_sql(data))
        lines.append("")
        lines.append("SET FOREIGN_KEY_CHECKS = 1;")

        output_path.write_text("\n".join(lines) + "\n", encoding="utf-8")

    def _build_insert_sql(self, data: dict[str, list[Any]]) -> list[str]:
        result: list[str] = []
        for table in TABLE_ORDER:
            rows = data.get(table, [])
            if not rows:
                continue
            row_dicts = [self._to_row_dict(row) for row in rows]
            columns = list(row_dicts[0].keys())
            column_sql = ", ".join(f"`{col}`" for col in columns)
            result.append(f"INSERT INTO {table} ({column_sql}) VALUES")
            values_sql: list[str] = []
            for row in row_dicts:
                values = ", ".join(self._to_sql_value(row[col]) for col in columns)
                values_sql.append(f"  ({values})")
            result.append(",\n".join(values_sql) + ";")
        return result

    @staticmethod
    def _to_row_dict(row: Any) -> dict[str, Any]:
        if hasattr(row, "as_dict"):
            return row.as_dict()
        if isinstance(row, dict):
            return row
        raise TypeError(f"unsupported row type: {type(row)!r}")

    def _to_sql_value(self, value: Any) -> str:
        if value is None:
            return "NULL"
        if isinstance(value, bool):
            return "1" if value else "0"
        if isinstance(value, (int, float)):
            return str(value)
        if isinstance(value, datetime):
            return f"'{value.strftime('%Y-%m-%d %H:%M:%S')}'"
        if isinstance(value, date):
            return f"'{value.strftime('%Y-%m-%d')}'"
        escaped = str(value).replace("\\", "\\\\").replace("'", "''")
        return f"'{escaped}'"
