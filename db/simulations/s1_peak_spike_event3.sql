-- Scenario 1: Peak spike
-- Goal: Create a sharp congestion spike on event_id=3 during a short window.

START TRANSACTION;

SET @s1_event_id := 3;
SET @s1_start := CAST('2026-03-22 14:00:00' AS DATETIME);
SET @s1_end := CAST('2026-03-22 14:29:00' AS DATETIME);
SET @s1_qr_id := COALESCE(
  (SELECT MIN(qr_id) FROM qr_codes WHERE event_id = @s1_event_id),
  (SELECT MIN(qr_id) FROM qr_codes)
);

DROP TEMPORARY TABLE IF EXISTS tmp_s1_booths;
CREATE TEMPORARY TABLE tmp_s1_booths AS
SELECT b.booth_id, b.zone, b.place_name
FROM booths b
WHERE b.event_id = @s1_event_id
ORDER BY b.booth_id
LIMIT 4;

DROP TEMPORARY TABLE IF EXISTS tmp_s1_programs;
CREATE TEMPORARY TABLE tmp_s1_programs AS
SELECT p.program_id, p.booth_id, b.zone, b.place_name
FROM event_program p
JOIN booths b ON b.booth_id = p.booth_id
WHERE p.event_id = @s1_event_id
  AND p.booth_id IN (SELECT booth_id FROM tmp_s1_booths)
ORDER BY p.program_id
LIMIT 6;

INSERT INTO qr_logs (log_id, qr_id, booth_id, check_type, checked_at)
WITH RECURSIVE minute_seq AS (
  SELECT @s1_start AS ts
  UNION ALL
  SELECT DATE_ADD(ts, INTERVAL 1 MINUTE)
  FROM minute_seq
  WHERE ts < @s1_end
),
burst AS (
  SELECT 1 AS n
  UNION ALL
  SELECT n + 1 FROM burst WHERE n < 10
),
payload AS (
  SELECT
    ROW_NUMBER() OVER (ORDER BY m.ts, b.booth_id, s.n) AS rn,
    b.booth_id,
    DATE_ADD(m.ts, INTERVAL s.n SECOND) AS checked_at
  FROM minute_seq m
  JOIN tmp_s1_booths b
  JOIN burst s
)
SELECT
  910000000 + rn AS log_id,
  @s1_qr_id AS qr_id,
  booth_id,
  'CHECKIN',
  checked_at
FROM payload
ON DUPLICATE KEY UPDATE
  qr_id = VALUES(qr_id),
  booth_id = VALUES(booth_id),
  check_type = VALUES(check_type),
  checked_at = VALUES(checked_at);

INSERT INTO qr_logs (log_id, qr_id, booth_id, check_type, checked_at)
WITH RECURSIVE minute_seq AS (
  SELECT @s1_start AS ts
  UNION ALL
  SELECT DATE_ADD(ts, INTERVAL 1 MINUTE)
  FROM minute_seq
  WHERE ts < @s1_end
),
outflow AS (
  SELECT 1 AS n
  UNION ALL
  SELECT n + 1 FROM outflow WHERE n < 2
),
payload AS (
  SELECT
    ROW_NUMBER() OVER (ORDER BY m.ts, b.booth_id, s.n) AS rn,
    b.booth_id,
    DATE_ADD(m.ts, INTERVAL (40 + s.n) SECOND) AS checked_at
  FROM minute_seq m
  JOIN tmp_s1_booths b
  JOIN outflow s
)
SELECT
  910100000 + rn AS log_id,
  @s1_qr_id AS qr_id,
  booth_id,
  'CHECKOUT',
  checked_at
FROM payload
ON DUPLICATE KEY UPDATE
  qr_id = VALUES(qr_id),
  booth_id = VALUES(booth_id),
  check_type = VALUES(check_type),
  checked_at = VALUES(checked_at);

INSERT INTO booth_waits (wait_id, booth_id, wait_count, wait_min, updated_at)
SELECT
  911000000 + ROW_NUMBER() OVER (ORDER BY booth_id) AS wait_id,
  booth_id,
  180 AS wait_count,
  30 AS wait_min,
  @s1_end AS updated_at
FROM tmp_s1_booths
ON DUPLICATE KEY UPDATE
  wait_count = GREATEST(wait_count, VALUES(wait_count)),
  wait_min = GREATEST(wait_min, VALUES(wait_min)),
  updated_at = VALUES(updated_at);

INSERT INTO experience_waits (wait_id, program_id, wait_count, wait_min, updated_at)
SELECT
  911100000 + ROW_NUMBER() OVER (ORDER BY program_id) AS wait_id,
  program_id,
  140 AS wait_count,
  25 AS wait_min,
  @s1_end AS updated_at
FROM tmp_s1_programs
ON DUPLICATE KEY UPDATE
  wait_count = GREATEST(wait_count, VALUES(wait_count)),
  wait_min = GREATEST(wait_min, VALUES(wait_min)),
  updated_at = VALUES(updated_at);

INSERT INTO congestions (congestion_id, program_id, zone, place_name, congestion_level, measured_at)
WITH RECURSIVE point_seq AS (
  SELECT @s1_start AS ts
  UNION ALL
  SELECT DATE_ADD(ts, INTERVAL 5 MINUTE)
  FROM point_seq
  WHERE ts < @s1_end
),
payload AS (
  SELECT
    ROW_NUMBER() OVER (ORDER BY p.program_id, t.ts) AS rn,
    p.program_id,
    p.zone,
    p.place_name,
    IF(MOD(ROW_NUMBER() OVER (ORDER BY p.program_id, t.ts), 3) = 0, 4, 5) AS lvl,
    DATE_ADD(t.ts, INTERVAL 50 SECOND) AS measured_at
  FROM tmp_s1_programs p
  JOIN point_seq t
)
SELECT
  912000000 + rn AS congestion_id,
  program_id,
  zone,
  place_name,
  lvl,
  measured_at
FROM payload
ON DUPLICATE KEY UPDATE
  program_id = VALUES(program_id),
  zone = VALUES(zone),
  place_name = VALUES(place_name),
  congestion_level = VALUES(congestion_level),
  measured_at = VALUES(measured_at);

DROP TEMPORARY TABLE IF EXISTS tmp_s1_programs;
DROP TEMPORARY TABLE IF EXISTS tmp_s1_booths;

COMMIT;
