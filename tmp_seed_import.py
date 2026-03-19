import time
from pathlib import Path

import pymysql
import sqlparse


SQL_PATH = Path(r"C:\pupoo_workspace\popups\db\pupoo_seed_v6.6_practical_image_urls_rewritten.sql")
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


def maybe_rewrite(stmt: str) -> str:
    lower = stmt.lstrip().lower()
    if lower.startswith("insert into booth_waits "):
        return (
            stmt
            + " ON DUPLICATE KEY UPDATE "
            + "wait_count=VALUES(wait_count), wait_min=VALUES(wait_min), updated_at=VALUES(updated_at)"
        )
    if lower.startswith("insert into experience_waits "):
        return (
            stmt
            + " ON DUPLICATE KEY UPDATE "
            + "wait_count=VALUES(wait_count), wait_min=VALUES(wait_min), updated_at=VALUES(updated_at)"
        )
    return stmt


def main() -> None:
    sql_text = SQL_PATH.read_text(encoding="utf-8")
    statements = [s.strip() for s in sqlparse.split(sql_text) if s.strip()]
    total = len(statements)
    print(f"Total statements: {total}")

    started = time.time()
    conn = pymysql.connect(**DB_CONFIG)
    try:
        with conn.cursor() as cur:
            cur.execute("SET SESSION innodb_lock_wait_timeout = 120")
            for idx, raw_stmt in enumerate(statements, start=1):
                stmt = maybe_rewrite(raw_stmt.rstrip(";"))
                attempt = 0
                while True:
                    try:
                        cur.execute(stmt)
                        break
                    except pymysql.err.OperationalError as e:
                        msg = str(e)
                        if "Lock wait timeout exceeded" in msg and attempt < 20:
                            attempt += 1
                            print(f"Lock wait retry {attempt} at statement #{idx}")
                            time.sleep(2)
                            continue
                        print(f"FAILED at statement #{idx}")
                        print(stmt[:500] + ("..." if len(stmt) > 500 else ""))
                        raise
                    except Exception:
                        print(f"FAILED at statement #{idx}")
                        print(stmt[:500] + ("..." if len(stmt) > 500 else ""))
                        raise

                if idx % 10 == 0:
                    print(f"Executed {idx} / {total}")
    finally:
        conn.close()

    elapsed = int(time.time() - started)
    print(f"Seed import completed. executed={total}, elapsedSec={elapsed}")


if __name__ == "__main__":
    main()
