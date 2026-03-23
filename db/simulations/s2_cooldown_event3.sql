-- Scenario 2: Cooldown after spike
-- Goal: Force outflow and lower congestion right after S1 window.

START TRANSACTION;

SET @s2_event_id := 3;
SET @s2_start := CAST('2026-03-22 14:30:00' AS DATETIME);
SET @s2_end := CAST('2026-03-22 15:10:00' AS DATETIME);
SET @s2_qr_id := COALESCE(
  (SELECT MIN(qr_id) FROM qr_codes WHERE event_id = @s2_event_id),
  (SELECT MIN(qr_id) FROM qr_codes)
);

DROP TEMPORARY TABLE IF EXISTS tmp_s2_booths;
CREATE TEMPORARY TABLE tmp_s2_booths AS
SELECT b.booth_id, b.zone, b.place_name
FROM booths b
WHERE b.event_id = @s2_event_id
ORDER BY b.booth_id
LIMIT 4;

DROP TEMPORARY TABLE IF EXISTS tmp_s2_programs;
CREATE TEMPORARY TABLE tmp_s2_programs AS
SELECT p.program_id, p.booth_id, b.zone, b.place_name
FROM event_program p
JOIN booths b ON b.booth_id = p.booth_id
WHERE p.event_id = @s2_event_id
  AND p.booth_id IN (SELECT booth_id FROM tmp_s2_booths)
ORDER BY p.program_id
LIMIT 6;

INSERT INTO qr_logs (log_id, qr_id, booth_id, check_type, checked_at)
WITH RECURSIVE minute_seq AS (
  SELECT @s2_start AS ts
  UNION ALL
  SELECT DATE_ADD(ts, INTERVAL 1 MINUTE)
  FROM minute_seq
  WHERE ts < @s2_end
),
light_inflow AS (
  SELECT 1 AS n
  UNION ALL
  SELECT n + 1 FROM light_inflow WHERE n < 2
),
payload AS (
  SELECT
    ROW_NUMBER() OVER (ORDER BY m.ts, b.booth_id, s.n) AS rn,
    b.booth_id,
    DATE_ADD(m.ts, INTERVAL s.n SECOND) AS checked_at
  FROM minute_seq m
  JOIN tmp_s2_booths b
  JOIN light_inflow s
)
SELECT
  920000000 + rn AS log_id,
  @s2_qr_id AS qr_id,
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
  SELECT @s2_start AS ts
  UNION ALL
  SELECT DATE_ADD(ts, INTERVAL 1 MINUTE)
  FROM minute_seq
  WHERE ts < @s2_end
),
heavy_outflow AS (
  SELECT 1 AS n
  UNION ALL
  SELECT n + 1 FROM heavy_outflow WHERE n < 9
),
payload AS (
  SELECT
    ROW_NUMBER() OVER (ORDER BY m.ts, b.booth_id, s.n) AS rn,
    b.booth_id,
    DATE_ADD(m.ts, INTERVAL (25 + s.n) SECOND) AS checked_at
  FROM minute_seq m
  JOIN tmp_s2_booths b
  JOIN heavy_outflow s
)
SELECT
  920100000 + rn AS log_id,
  @s2_qr_id AS qr_id,
  booth_id,
  'CHECKOUT',
  checked_at
FROM payload
ON DUPLICATE KEY UPDATE
  qr_id = VALUES(qr_id),
  booth_id = VALUES(booth_id),
  check_type = VALUES(check_type),
  checked_at = VALUES(checked_at);

UPDATE booth_waits bw
JOIN tmp_s2_booths b ON b.booth_id = bw.booth_id
SET
  bw.wait_count = GREATEST(1, COALESCE(bw.wait_count, 1) - 80),
  bw.wait_min = GREATEST(2, COALESCE(bw.wait_min, 2) - 12),
  bw.updated_at = @s2_end;

INSERT INTO booth_waits (wait_id, booth_id, wait_count, wait_min, updated_at)
SELECT
  921000000 + ROW_NUMBER() OVER (ORDER BY booth_id) AS wait_id,
  booth_id,
  20 AS wait_count,
  5 AS wait_min,
  @s2_end AS updated_at
FROM tmp_s2_booths
ON DUPLICATE KEY UPDATE
  wait_count = VALUES(wait_count),
  wait_min = VALUES(wait_min),
  updated_at = VALUES(updated_at);

UPDATE experience_waits ew
JOIN tmp_s2_programs p ON p.program_id = ew.program_id
SET
  ew.wait_count = GREATEST(0, COALESCE(ew.wait_count, 0) - 70),
  ew.wait_min = GREATEST(1, COALESCE(ew.wait_min, 1) - 10),
  ew.updated_at = @s2_end;

INSERT INTO experience_waits (wait_id, program_id, wait_count, wait_min, updated_at)
SELECT
  921100000 + ROW_NUMBER() OVER (ORDER BY program_id) AS wait_id,
  program_id,
  18 AS wait_count,
  4 AS wait_min,
  @s2_end AS updated_at
FROM tmp_s2_programs
ON DUPLICATE KEY UPDATE
  wait_count = VALUES(wait_count),
  wait_min = VALUES(wait_min),
  updated_at = VALUES(updated_at);

INSERT INTO congestions (congestion_id, program_id, zone, place_name, congestion_level, measured_at)
WITH RECURSIVE point_seq AS (
  SELECT @s2_start AS ts
  UNION ALL
  SELECT DATE_ADD(ts, INTERVAL 5 MINUTE)
  FROM point_seq
  WHERE ts < @s2_end
),
payload AS (
  SELECT
    ROW_NUMBER() OVER (ORDER BY p.program_id, t.ts) AS rn,
    p.program_id,
    p.zone,
    p.place_name,
    IF(MOD(ROW_NUMBER() OVER (ORDER BY p.program_id, t.ts), 2) = 0, 2, 3) AS lvl,
    DATE_ADD(t.ts, INTERVAL 35 SECOND) AS measured_at
  FROM tmp_s2_programs p
  JOIN point_seq t
)
SELECT
  922000000 + rn AS congestion_id,
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

DROP TEMPORARY TABLE IF EXISTS tmp_s2_programs;
DROP TEMPORARY TABLE IF EXISTS tmp_s2_booths;

COMMIT;
