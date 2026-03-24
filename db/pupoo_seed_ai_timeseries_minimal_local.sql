-- Minimal AI timeseries seed (local)
-- Built from currently loaded operational tables in pupoodb.
-- Target volume (approx):
-- - ai_event_congestion_timeseries: ~800-1,200 rows
-- - ai_program_congestion_timeseries: ~3,000-5,000 rows

SET @seed_now := NOW();

DELETE FROM ai_prediction_logs;
DELETE FROM ai_training_dataset;
DELETE FROM ai_program_congestion_timeseries;
DELETE FROM ai_event_congestion_timeseries;

DROP TEMPORARY TABLE IF EXISTS tmp_ai_seq_5m;
CREATE TEMPORARY TABLE tmp_ai_seq_5m (
  minute_offset INT NOT NULL PRIMARY KEY
);

INSERT INTO tmp_ai_seq_5m (minute_offset)
WITH RECURSIVE seq AS (
  SELECT 0 AS n
  UNION ALL
  SELECT n + 5
  FROM seq
  WHERE n < 715
)
SELECT n FROM seq;

DROP TEMPORARY TABLE IF EXISTS tmp_ai_day_offset;
CREATE TEMPORARY TABLE tmp_ai_day_offset (
  day_offset INT NOT NULL PRIMARY KEY
);

INSERT INTO tmp_ai_day_offset(day_offset) VALUES (0), (1);

DROP TEMPORARY TABLE IF EXISTS tmp_ai_selected_events;
CREATE TEMPORARY TABLE tmp_ai_selected_events AS
SELECT
  e.event_id,
  DATE(e.start_at) AS start_date,
  TIME(e.start_at) AS start_time,
  TIME(e.end_at) AS end_time,
  LEAST(2, GREATEST(1, DATEDIFF(DATE(e.end_at), DATE(e.start_at)) + 1)) AS day_span,
  LEAST(
    720,
    GREATEST(
      240,
      CASE
        WHEN TIME(e.end_at) > TIME(e.start_at) THEN TIMESTAMPDIFF(
          MINUTE,
          CAST(CONCAT('2000-01-01 ', TIME(e.start_at)) AS DATETIME),
          CAST(CONCAT('2000-01-01 ', TIME(e.end_at)) AS DATETIME)
        )
        ELSE 540
      END
    )
  ) AS operation_minutes
FROM event e
WHERE e.status <> 'CANCELLED'
ORDER BY e.start_at ASC, e.event_id ASC
LIMIT 5;

DROP TEMPORARY TABLE IF EXISTS tmp_ai_event_apply;
CREATE TEMPORARY TABLE tmp_ai_event_apply AS
SELECT
  ea.event_id,
  COUNT(*) AS active_apply_count
FROM event_apply ea
WHERE ea.status IN ('APPLIED', 'APPROVED')
GROUP BY ea.event_id;

DROP TEMPORARY TABLE IF EXISTS tmp_ai_event_program_count;
CREATE TEMPORARY TABLE tmp_ai_event_program_count AS
SELECT
  p.event_id,
  COUNT(*) AS program_count
FROM event_program p
GROUP BY p.event_id;

DROP TEMPORARY TABLE IF EXISTS tmp_ai_event_wait;
CREATE TEMPORARY TABLE tmp_ai_event_wait AS
SELECT
  b.event_id,
  COALESCE(SUM(w.wait_count), 0) AS total_wait_count,
  AVG(w.wait_min) AS avg_wait_min
FROM booths b
LEFT JOIN booth_waits w ON w.booth_id = b.booth_id
GROUP BY b.event_id;

INSERT INTO ai_event_congestion_timeseries (
  event_id,
  timestamp_minute,
  checkins_1m,
  checkouts_1m,
  active_apply_count,
  total_wait_count,
  avg_wait_min,
  running_program_count,
  progress_minute,
  hour_of_day,
  day_of_week,
  congestion_score
)
SELECT
  se.event_id,
  DATE_ADD(
    TIMESTAMP(DATE_ADD(se.start_date, INTERVAL d.day_offset DAY), se.start_time),
    INTERVAL s.minute_offset MINUTE
  ) AS timestamp_minute,
  GREATEST(
    0,
    ROUND(
      (1.2 + COALESCE(ea.active_apply_count, 0) / 220.0)
      * EXP(-POW((((s.minute_offset + 0.0) / GREATEST(se.operation_minutes, 1)) - 0.55) / 0.22, 2))
      * 6
      + MOD(se.event_id + s.minute_offset, 3)
    )
  ) AS checkins_1m,
  GREATEST(
    0,
    ROUND(
      (0.8 + COALESCE(ea.active_apply_count, 0) / 260.0)
      * EXP(-POW((((s.minute_offset + 0.0) / GREATEST(se.operation_minutes, 1)) - 0.72) / 0.24, 2))
      * 4
      + MOD(s.minute_offset + se.event_id, 2)
    )
  ) AS checkouts_1m,
  COALESCE(ea.active_apply_count, 0) AS active_apply_count,
  GREATEST(
    0,
    COALESCE(ew.total_wait_count, 0)
    + ROUND(
      (1.2 + COALESCE(ea.active_apply_count, 0) / 220.0)
      * EXP(-POW((((s.minute_offset + 0.0) / GREATEST(se.operation_minutes, 1)) - 0.55) / 0.22, 2))
      * 6
    )
  ) AS total_wait_count,
  ROUND(
    GREATEST(
      0.0,
      COALESCE(ew.avg_wait_min, 8.0)
      + EXP(-POW((((s.minute_offset + 0.0) / GREATEST(se.operation_minutes, 1)) - 0.60) / 0.30, 2)) * 6
    ),
    2
  ) AS avg_wait_min,
  GREATEST(1, COALESCE(ep.program_count, 1)) AS running_program_count,
  d.day_offset * se.operation_minutes + s.minute_offset AS progress_minute,
  HOUR(
    DATE_ADD(
      TIMESTAMP(DATE_ADD(se.start_date, INTERVAL d.day_offset DAY), se.start_time),
      INTERVAL s.minute_offset MINUTE
    )
  ) AS hour_of_day,
  WEEKDAY(
    DATE_ADD(
      TIMESTAMP(DATE_ADD(se.start_date, INTERVAL d.day_offset DAY), se.start_time),
      INTERVAL s.minute_offset MINUTE
    )
  ) + 1 AS day_of_week,
  ROUND(
    LEAST(
      100.0,
      GREATEST(
        0.0,
        (
          (GREATEST(
            0,
            ROUND(
              (1.2 + COALESCE(ea.active_apply_count, 0) / 220.0)
              * EXP(-POW((((s.minute_offset + 0.0) / GREATEST(se.operation_minutes, 1)) - 0.55) / 0.22, 2))
              * 6
            )
          ) * 0.70)
          + (GREATEST(0, COALESCE(ew.total_wait_count, 0)) * 0.0060)
          + (COALESCE(ea.active_apply_count, 0) * 0.0035)
          + (GREATEST(1, COALESCE(ep.program_count, 1)) * 0.0800)
        )
      )
    ),
    2
  ) AS congestion_score
FROM tmp_ai_selected_events se
JOIN tmp_ai_day_offset d
  ON d.day_offset < se.day_span
JOIN tmp_ai_seq_5m s
  ON s.minute_offset <= se.operation_minutes
LEFT JOIN tmp_ai_event_apply ea
  ON ea.event_id = se.event_id
LEFT JOIN tmp_ai_event_program_count ep
  ON ep.event_id = se.event_id
LEFT JOIN tmp_ai_event_wait ew
  ON ew.event_id = se.event_id
WHERE DATE_ADD(
  TIMESTAMP(DATE_ADD(se.start_date, INTERVAL d.day_offset DAY), se.start_time),
  INTERVAL s.minute_offset MINUTE
) <= @seed_now
ON DUPLICATE KEY UPDATE
  checkins_1m = VALUES(checkins_1m),
  checkouts_1m = VALUES(checkouts_1m),
  active_apply_count = VALUES(active_apply_count),
  total_wait_count = VALUES(total_wait_count),
  avg_wait_min = VALUES(avg_wait_min),
  running_program_count = VALUES(running_program_count),
  progress_minute = VALUES(progress_minute),
  hour_of_day = VALUES(hour_of_day),
  day_of_week = VALUES(day_of_week),
  congestion_score = VALUES(congestion_score),
  updated_at = CURRENT_TIMESTAMP;

DROP TEMPORARY TABLE IF EXISTS tmp_ai_selected_programs;
CREATE TEMPORARY TABLE tmp_ai_selected_programs AS
SELECT
  ranked.program_id,
  ranked.event_id,
  COALESCE(ranked.capacity, 80) AS capacity,
  GREATEST(1, COALESCE(ranked.throughput_per_min, 3)) AS throughput_per_min
FROM (
  SELECT
    p.*,
    ROW_NUMBER() OVER (PARTITION BY p.event_id ORDER BY p.start_at ASC, p.program_id ASC) AS rn
  FROM event_program p
  JOIN tmp_ai_selected_events se ON se.event_id = p.event_id
) ranked
WHERE ranked.rn <= 4;

DROP TEMPORARY TABLE IF EXISTS tmp_ai_program_apply;
CREATE TEMPORARY TABLE tmp_ai_program_apply AS
SELECT
  pa.program_id,
  COUNT(*) AS active_apply_count
FROM event_program_apply pa
WHERE pa.status IN ('APPLIED', 'APPROVED', 'CHECKED_IN')
GROUP BY pa.program_id;

DROP TEMPORARY TABLE IF EXISTS tmp_ai_program_wait;
CREATE TEMPORARY TABLE tmp_ai_program_wait AS
SELECT
  w.program_id,
  AVG(w.wait_min) AS avg_wait_min,
  MAX(w.wait_count) AS max_wait_count
FROM experience_waits w
GROUP BY w.program_id;

INSERT INTO ai_program_congestion_timeseries (
  event_id,
  program_id,
  timestamp_minute,
  checkins_1m,
  checkouts_1m,
  active_apply_count,
  wait_count,
  wait_min,
  progress_minute,
  hour_of_day,
  day_of_week,
  congestion_score
)
SELECT
  sp.event_id,
  sp.program_id,
  DATE_ADD(
    TIMESTAMP(DATE_ADD(se.start_date, INTERVAL d.day_offset DAY), se.start_time),
    INTERVAL s.minute_offset MINUTE
  ) AS timestamp_minute,
  GREATEST(
    0,
    ROUND(
      (0.9 + COALESCE(pa.active_apply_count, 0) / 160.0)
      * EXP(-POW((((s.minute_offset + 0.0) / GREATEST(se.operation_minutes, 1)) - 0.58) / 0.24, 2))
      * 5
      + MOD(sp.program_id + s.minute_offset, 2)
    )
  ) AS checkins_1m,
  GREATEST(
    0,
    ROUND(
      (0.7 + COALESCE(pa.active_apply_count, 0) / 210.0)
      * EXP(-POW((((s.minute_offset + 0.0) / GREATEST(se.operation_minutes, 1)) - 0.75) / 0.26, 2))
      * 3
      + MOD(sp.program_id + s.minute_offset, 2)
    )
  ) AS checkouts_1m,
  COALESCE(pa.active_apply_count, 0) AS active_apply_count,
  GREATEST(
    0,
    ROUND(
      COALESCE(pa.active_apply_count, 0) * 0.08
      + COALESCE(pw.max_wait_count, 0) * 0.30
      + (
        (0.9 + COALESCE(pa.active_apply_count, 0) / 160.0)
        * EXP(-POW((((s.minute_offset + 0.0) / GREATEST(se.operation_minutes, 1)) - 0.58) / 0.24, 2))
        * 5
      )
    )
  ) AS wait_count,
  CAST(
    ROUND(
      GREATEST(
        0.0,
        COALESCE(pw.avg_wait_min, 6.0)
        + (
          (
            COALESCE(pa.active_apply_count, 0) * 0.08
            + COALESCE(pw.max_wait_count, 0) * 0.30
          ) / GREATEST(sp.throughput_per_min, 1)
        )
      ),
      0
    ) AS SIGNED
  ) AS wait_min,
  d.day_offset * se.operation_minutes + s.minute_offset AS progress_minute,
  HOUR(
    DATE_ADD(
      TIMESTAMP(DATE_ADD(se.start_date, INTERVAL d.day_offset DAY), se.start_time),
      INTERVAL s.minute_offset MINUTE
    )
  ) AS hour_of_day,
  WEEKDAY(
    DATE_ADD(
      TIMESTAMP(DATE_ADD(se.start_date, INTERVAL d.day_offset DAY), se.start_time),
      INTERVAL s.minute_offset MINUTE
    )
  ) + 1 AS day_of_week,
  ROUND(
    LEAST(
      100.0,
      GREATEST(
        0.0,
        (
          (GREATEST(
            0,
            ROUND(
              (0.9 + COALESCE(pa.active_apply_count, 0) / 160.0)
              * EXP(-POW((((s.minute_offset + 0.0) / GREATEST(se.operation_minutes, 1)) - 0.58) / 0.24, 2))
              * 5
            )
          ) * 1.5)
          + (GREATEST(0, COALESCE(pa.active_apply_count, 0)) * 0.12)
          + (GREATEST(0, COALESCE(pw.max_wait_count, 0)) * 0.55)
        )
      )
    ),
    2
  ) AS congestion_score
FROM tmp_ai_selected_programs sp
JOIN tmp_ai_selected_events se
  ON se.event_id = sp.event_id
JOIN tmp_ai_day_offset d
  ON d.day_offset < se.day_span
JOIN tmp_ai_seq_5m s
  ON s.minute_offset <= se.operation_minutes
LEFT JOIN tmp_ai_program_apply pa
  ON pa.program_id = sp.program_id
LEFT JOIN tmp_ai_program_wait pw
  ON pw.program_id = sp.program_id
WHERE DATE_ADD(
  TIMESTAMP(DATE_ADD(se.start_date, INTERVAL d.day_offset DAY), se.start_time),
  INTERVAL s.minute_offset MINUTE
) <= @seed_now
ON DUPLICATE KEY UPDATE
  checkins_1m = VALUES(checkins_1m),
  checkouts_1m = VALUES(checkouts_1m),
  active_apply_count = VALUES(active_apply_count),
  wait_count = VALUES(wait_count),
  wait_min = VALUES(wait_min),
  progress_minute = VALUES(progress_minute),
  hour_of_day = VALUES(hour_of_day),
  day_of_week = VALUES(day_of_week),
  congestion_score = VALUES(congestion_score),
  updated_at = CURRENT_TIMESTAMP;

DROP TEMPORARY TABLE IF EXISTS tmp_ai_program_wait;
DROP TEMPORARY TABLE IF EXISTS tmp_ai_program_apply;
DROP TEMPORARY TABLE IF EXISTS tmp_ai_selected_programs;
DROP TEMPORARY TABLE IF EXISTS tmp_ai_event_wait;
DROP TEMPORARY TABLE IF EXISTS tmp_ai_event_program_count;
DROP TEMPORARY TABLE IF EXISTS tmp_ai_event_apply;
DROP TEMPORARY TABLE IF EXISTS tmp_ai_selected_events;
DROP TEMPORARY TABLE IF EXISTS tmp_ai_day_offset;
DROP TEMPORARY TABLE IF EXISTS tmp_ai_seq_5m;
