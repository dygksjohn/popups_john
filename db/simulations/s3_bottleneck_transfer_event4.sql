-- Scenario 3: Bottleneck transfer (Zone A -> Zone B)
-- Goal: Build a two-phase shift where congestion starts in Zone A and then moves to Zone B.

START TRANSACTION;

SET @s3_event_id := 4;
SET @s3_a_start := CAST('2026-03-23 13:00:00' AS DATETIME);
SET @s3_a_end := CAST('2026-03-23 13:25:00' AS DATETIME);
SET @s3_b_start := CAST('2026-03-23 13:30:00' AS DATETIME);
SET @s3_b_end := CAST('2026-03-23 13:55:00' AS DATETIME);
SET @s3_qr_id := COALESCE(
  (SELECT MIN(qr_id) FROM qr_codes WHERE event_id = @s3_event_id),
  (SELECT MIN(qr_id) FROM qr_codes)
);

DROP TEMPORARY TABLE IF EXISTS tmp_s3_zone_a_booths;
CREATE TEMPORARY TABLE tmp_s3_zone_a_booths AS
SELECT b.booth_id, b.zone, b.place_name
FROM booths b
WHERE b.event_id = @s3_event_id
  AND b.zone = 'ZONE_A'
ORDER BY b.booth_id
LIMIT 3;

SET @s3_za_count := (SELECT COUNT(*) FROM tmp_s3_zone_a_booths);
INSERT INTO tmp_s3_zone_a_booths (booth_id, zone, place_name)
SELECT b.booth_id, b.zone, b.place_name
FROM booths b
WHERE @s3_za_count = 0
  AND b.event_id = @s3_event_id
ORDER BY b.booth_id
LIMIT 2;

DROP TEMPORARY TABLE IF EXISTS tmp_s3_zone_b_booths;
CREATE TEMPORARY TABLE tmp_s3_zone_b_booths AS
SELECT b.booth_id, b.zone, b.place_name
FROM booths b
WHERE b.event_id = @s3_event_id
  AND b.zone = 'ZONE_B'
  AND b.booth_id NOT IN (SELECT booth_id FROM tmp_s3_zone_a_booths)
ORDER BY b.booth_id
LIMIT 3;

SET @s3_zb_count := (SELECT COUNT(*) FROM tmp_s3_zone_b_booths);
INSERT INTO tmp_s3_zone_b_booths (booth_id, zone, place_name)
SELECT b.booth_id, b.zone, b.place_name
FROM booths b
WHERE @s3_zb_count = 0
  AND b.event_id = @s3_event_id
  AND b.booth_id NOT IN (SELECT booth_id FROM tmp_s3_zone_a_booths)
ORDER BY b.booth_id
LIMIT 2;

DROP TEMPORARY TABLE IF EXISTS tmp_s3_zone_a_programs;
CREATE TEMPORARY TABLE tmp_s3_zone_a_programs AS
SELECT p.program_id, p.booth_id, b.zone, b.place_name
FROM event_program p
JOIN booths b ON b.booth_id = p.booth_id
WHERE p.event_id = @s3_event_id
  AND p.booth_id IN (SELECT booth_id FROM tmp_s3_zone_a_booths);

DROP TEMPORARY TABLE IF EXISTS tmp_s3_zone_b_programs;
CREATE TEMPORARY TABLE tmp_s3_zone_b_programs AS
SELECT p.program_id, p.booth_id, b.zone, b.place_name
FROM event_program p
JOIN booths b ON b.booth_id = p.booth_id
WHERE p.event_id = @s3_event_id
  AND p.booth_id IN (SELECT booth_id FROM tmp_s3_zone_b_booths);

-- Phase A: Zone A inflow spike
INSERT INTO qr_logs (log_id, qr_id, booth_id, check_type, checked_at)
WITH RECURSIVE minute_seq AS (
  SELECT @s3_a_start AS ts
  UNION ALL
  SELECT DATE_ADD(ts, INTERVAL 1 MINUTE)
  FROM minute_seq
  WHERE ts < @s3_a_end
),
burst AS (
  SELECT 1 AS n
  UNION ALL
  SELECT n + 1 FROM burst WHERE n < 8
),
payload AS (
  SELECT
    ROW_NUMBER() OVER (ORDER BY m.ts, b.booth_id, s.n) AS rn,
    b.booth_id,
    DATE_ADD(m.ts, INTERVAL s.n SECOND) AS checked_at
  FROM minute_seq m
  JOIN tmp_s3_zone_a_booths b
  JOIN burst s
)
SELECT
  930000000 + rn AS log_id,
  @s3_qr_id AS qr_id,
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
  SELECT @s3_a_start AS ts
  UNION ALL
  SELECT DATE_ADD(ts, INTERVAL 1 MINUTE)
  FROM minute_seq
  WHERE ts < @s3_a_end
),
light_outflow AS (
  SELECT 1 AS n
  UNION ALL
  SELECT n + 1 FROM light_outflow WHERE n < 2
),
payload AS (
  SELECT
    ROW_NUMBER() OVER (ORDER BY m.ts, b.booth_id, s.n) AS rn,
    b.booth_id,
    DATE_ADD(m.ts, INTERVAL (35 + s.n) SECOND) AS checked_at
  FROM minute_seq m
  JOIN tmp_s3_zone_a_booths b
  JOIN light_outflow s
)
SELECT
  930100000 + rn AS log_id,
  @s3_qr_id AS qr_id,
  booth_id,
  'CHECKOUT',
  checked_at
FROM payload
ON DUPLICATE KEY UPDATE
  qr_id = VALUES(qr_id),
  booth_id = VALUES(booth_id),
  check_type = VALUES(check_type),
  checked_at = VALUES(checked_at);

-- Phase B: Zone B inflow spike
INSERT INTO qr_logs (log_id, qr_id, booth_id, check_type, checked_at)
WITH RECURSIVE minute_seq AS (
  SELECT @s3_b_start AS ts
  UNION ALL
  SELECT DATE_ADD(ts, INTERVAL 1 MINUTE)
  FROM minute_seq
  WHERE ts < @s3_b_end
),
burst AS (
  SELECT 1 AS n
  UNION ALL
  SELECT n + 1 FROM burst WHERE n < 8
),
payload AS (
  SELECT
    ROW_NUMBER() OVER (ORDER BY m.ts, b.booth_id, s.n) AS rn,
    b.booth_id,
    DATE_ADD(m.ts, INTERVAL s.n SECOND) AS checked_at
  FROM minute_seq m
  JOIN tmp_s3_zone_b_booths b
  JOIN burst s
)
SELECT
  930200000 + rn AS log_id,
  @s3_qr_id AS qr_id,
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
  SELECT @s3_b_start AS ts
  UNION ALL
  SELECT DATE_ADD(ts, INTERVAL 1 MINUTE)
  FROM minute_seq
  WHERE ts < @s3_b_end
),
light_outflow AS (
  SELECT 1 AS n
  UNION ALL
  SELECT n + 1 FROM light_outflow WHERE n < 2
),
payload AS (
  SELECT
    ROW_NUMBER() OVER (ORDER BY m.ts, b.booth_id, s.n) AS rn,
    b.booth_id,
    DATE_ADD(m.ts, INTERVAL (35 + s.n) SECOND) AS checked_at
  FROM minute_seq m
  JOIN tmp_s3_zone_b_booths b
  JOIN light_outflow s
)
SELECT
  930300000 + rn AS log_id,
  @s3_qr_id AS qr_id,
  booth_id,
  'CHECKOUT',
  checked_at
FROM payload
ON DUPLICATE KEY UPDATE
  qr_id = VALUES(qr_id),
  booth_id = VALUES(booth_id),
  check_type = VALUES(check_type),
  checked_at = VALUES(checked_at);

-- Snapshot-style waits: final state makes Zone B hotter than Zone A
INSERT INTO booth_waits (wait_id, booth_id, wait_count, wait_min, updated_at)
SELECT
  931000000 + ROW_NUMBER() OVER (ORDER BY booth_id) AS wait_id,
  booth_id,
  70 AS wait_count,
  10 AS wait_min,
  @s3_a_end
FROM tmp_s3_zone_a_booths
ON DUPLICATE KEY UPDATE
  wait_count = VALUES(wait_count),
  wait_min = VALUES(wait_min),
  updated_at = VALUES(updated_at);

INSERT INTO booth_waits (wait_id, booth_id, wait_count, wait_min, updated_at)
SELECT
  931010000 + ROW_NUMBER() OVER (ORDER BY booth_id) AS wait_id,
  booth_id,
  170 AS wait_count,
  28 AS wait_min,
  @s3_b_end
FROM tmp_s3_zone_b_booths
ON DUPLICATE KEY UPDATE
  wait_count = VALUES(wait_count),
  wait_min = VALUES(wait_min),
  updated_at = VALUES(updated_at);

INSERT INTO experience_waits (wait_id, program_id, wait_count, wait_min, updated_at)
SELECT
  931100000 + ROW_NUMBER() OVER (ORDER BY program_id) AS wait_id,
  program_id,
  65 AS wait_count,
  9 AS wait_min,
  @s3_a_end
FROM tmp_s3_zone_a_programs
ON DUPLICATE KEY UPDATE
  wait_count = VALUES(wait_count),
  wait_min = VALUES(wait_min),
  updated_at = VALUES(updated_at);

INSERT INTO experience_waits (wait_id, program_id, wait_count, wait_min, updated_at)
SELECT
  931110000 + ROW_NUMBER() OVER (ORDER BY program_id) AS wait_id,
  program_id,
  150 AS wait_count,
  26 AS wait_min,
  @s3_b_end
FROM tmp_s3_zone_b_programs
ON DUPLICATE KEY UPDATE
  wait_count = VALUES(wait_count),
  wait_min = VALUES(wait_min),
  updated_at = VALUES(updated_at);

-- Congestion snapshots: A high in phase A, B high in phase B
INSERT INTO congestions (congestion_id, program_id, zone, place_name, congestion_level, measured_at)
WITH RECURSIVE point_seq AS (
  SELECT @s3_a_start AS ts
  UNION ALL
  SELECT DATE_ADD(ts, INTERVAL 5 MINUTE)
  FROM point_seq
  WHERE ts < @s3_a_end
),
payload AS (
  SELECT
    ROW_NUMBER() OVER (ORDER BY p.program_id, t.ts) AS rn,
    p.program_id,
    p.zone,
    p.place_name,
    5 AS lvl,
    DATE_ADD(t.ts, INTERVAL 45 SECOND) AS measured_at
  FROM tmp_s3_zone_a_programs p
  JOIN point_seq t
)
SELECT
  932000000 + rn AS congestion_id,
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

INSERT INTO congestions (congestion_id, program_id, zone, place_name, congestion_level, measured_at)
WITH RECURSIVE point_seq AS (
  SELECT @s3_b_start AS ts
  UNION ALL
  SELECT DATE_ADD(ts, INTERVAL 5 MINUTE)
  FROM point_seq
  WHERE ts < @s3_b_end
),
payload AS (
  SELECT
    ROW_NUMBER() OVER (ORDER BY p.program_id, t.ts) AS rn,
    p.program_id,
    p.zone,
    p.place_name,
    5 AS lvl,
    DATE_ADD(t.ts, INTERVAL 45 SECOND) AS measured_at
  FROM tmp_s3_zone_b_programs p
  JOIN point_seq t
)
SELECT
  932100000 + rn AS congestion_id,
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

DROP TEMPORARY TABLE IF EXISTS tmp_s3_zone_b_programs;
DROP TEMPORARY TABLE IF EXISTS tmp_s3_zone_a_programs;
DROP TEMPORARY TABLE IF EXISTS tmp_s3_zone_b_booths;
DROP TEMPORARY TABLE IF EXISTS tmp_s3_zone_a_booths;

COMMIT;
