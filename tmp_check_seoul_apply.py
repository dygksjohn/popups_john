import pymysql

conn = pymysql.connect(
    host="pupoodb.c50c2i048hc8.ap-northeast-2.rds.amazonaws.com",
    port=3306,
    user="pupoo",
    password="pupoo1234!",
    database="pupoodb",
    charset="utf8mb4",
)

try:
    with conn.cursor() as cur:
        cur.execute(
            "select event_id,event_name,start_at,end_at,status "
            "from event where event_name like %s order by event_id",
            ("%서울 펫 페스티벌%",),
        )
        events = cur.fetchall()
        print("events:", events)
        for event_id, *_ in events:
            cur.execute(
                "select status, count(*) from event_apply "
                "where event_id=%s group by status order by status",
                (event_id,),
            )
            by_status = cur.fetchall()
            cur.execute(
                "select count(*) from event_apply "
                "where event_id=%s and status in ('APPLIED','APPROVED')",
                (event_id,),
            )
            active = cur.fetchone()[0]
            print("event_id:", event_id, "by_status:", by_status, "active:", active)
finally:
    conn.close()
