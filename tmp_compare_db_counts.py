import pymysql

targets = [
    ("rds", "pupoodb.c50c2i048hc8.ap-northeast-2.rds.amazonaws.com", 3306),
    ("localhost", "localhost", 3306),
]

for name, host, port in targets:
    try:
        conn = pymysql.connect(
            host=host,
            port=port,
            user="pupoo",
            password="pupoo1234!",
            database="pupoodb",
            charset="utf8mb4",
            connect_timeout=3,
        )
        try:
            with conn.cursor() as cur:
                cur.execute("select count(*) from event")
                count = cur.fetchone()[0]
                print(f"{name}({host}) event_count={count}")
        finally:
            conn.close()
    except Exception as e:
        print(f"{name}({host}) connect_fail={e}")
