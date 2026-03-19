import datetime
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
        event_id = 1
        today = datetime.date.today()
        start = datetime.datetime.combine(today, datetime.time.min)
        end = datetime.datetime.combine(today, datetime.time.max)

        cur.execute(
            "select event_id,event_name,start_at,end_at from event where event_id=%s",
            (event_id,),
        )
        print("event:", cur.fetchone())

        cur.execute(
            """
            select count(*)
            from qr_logs l
            join qr_codes q on q.qr_id=l.qr_id
            where q.event_id=%s
              and l.check_type='CHECKIN'
              and l.checked_at between %s and %s
            """,
            (event_id, start, end),
        )
        print("qr_checkin_today:", cur.fetchone()[0])

        cur.execute(
            """
            select count(*)
            from event_program_apply epa
            join event_program ep on ep.program_id=epa.program_id
            where ep.event_id=%s
              and epa.checked_in_at between %s and %s
            """,
            (event_id, start, end),
        )
        print("program_checked_in_today:", cur.fetchone()[0])

        cur.execute(
            "select count(*) from event_apply where event_id=%s and status in ('APPLIED','APPROVED')",
            (event_id,),
        )
        print("pre_registered:", cur.fetchone()[0])
finally:
    conn.close()
