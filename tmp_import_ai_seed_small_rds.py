from pathlib import Path
import time

import pymysql
import sqlparse


SQL_PATH = Path(r"C:\pupoo_workspace\popups\db\pupoo_ai_seed_v6.6_small.sql")
DB_CONFIG = {
    "host": "pupoodb.c50c2i048hc8.ap-northeast-2.rds.amazonaws.com",
    "port": 3306,
    "user": "pupoo",
    "password": "pupoo1234!",
    "database": "pupoodb",
    "charset": "utf8mb4",
    "autocommit": True,
    "cursorclass": pymysql.cursors.Cursor,
}


def main() -> None:
    sql_text = SQL_PATH.read_text(encoding="utf-8")
    statements = [s.strip() for s in sqlparse.split(sql_text) if s.strip()]
    total = len(statements)
    print(f"total statements: {total}")

    started = time.time()
    conn = pymysql.connect(**DB_CONFIG)
    try:
        with conn.cursor() as cur:
            cur.execute("SET SESSION innodb_lock_wait_timeout = 120")
            for idx, stmt in enumerate(statements, start=1):
                cur.execute(stmt.rstrip(";"))
                if idx % 20 == 0 or idx == total:
                    print(f"executed {idx}/{total}")

            cur.execute("SELECT COUNT(*) FROM ai_event_congestion_timeseries")
            event_count = cur.fetchone()[0]
            cur.execute("SELECT COUNT(*) FROM ai_program_congestion_timeseries")
            program_count = cur.fetchone()[0]
            cur.execute("SELECT COUNT(*) FROM ai_training_dataset")
            training_count = cur.fetchone()[0]
            cur.execute("SELECT COUNT(*) FROM ai_prediction_logs")
            prediction_count = cur.fetchone()[0]

            print(f"ai_event_congestion_timeseries={event_count}")
            print(f"ai_program_congestion_timeseries={program_count}")
            print(f"ai_training_dataset={training_count}")
            print(f"ai_prediction_logs={prediction_count}")
    finally:
        conn.close()

    elapsed = int(time.time() - started)
    print(f"done in {elapsed}s")


if __name__ == "__main__":
    main()
