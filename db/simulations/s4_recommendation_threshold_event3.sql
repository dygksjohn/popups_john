-- Scenario 4: Recommendation threshold boundary
-- Goal: Make one "current" program hot (>= threshold) and other candidates cooler.
-- This script creates synthetic programs under event_id=3 and injects apply/wait/log signals.

START TRANSACTION;

SET @s4_event_id := 3;
SET @s4_now := NOW();
SET @s4_qr_id := COALESCE(
  (SELECT MIN(qr_id) FROM qr_codes WHERE event_id = @s4_event_id),
  (SELECT MIN(qr_id) FROM qr_codes)
);

DROP TEMPORARY TABLE IF EXISTS tmp_s4_booths;
CREATE TEMPORARY TABLE tmp_s4_booths AS
SELECT b.booth_id, b.zone, b.place_name
FROM booths b
WHERE b.event_id = @s4_event_id
ORDER BY b.booth_id
LIMIT 4;

SET @s4_booth_1 := (SELECT booth_id FROM tmp_s4_booths ORDER BY booth_id LIMIT 1);
SET @s4_booth_2 := (SELECT booth_id FROM tmp_s4_booths ORDER BY booth_id LIMIT 1 OFFSET 1);
SET @s4_booth_3 := (SELECT booth_id FROM tmp_s4_booths ORDER BY booth_id LIMIT 1 OFFSET 2);
SET @s4_booth_4 := (SELECT booth_id FROM tmp_s4_booths ORDER BY booth_id LIMIT 1 OFFSET 3);

SET @s4_booth_2 := COALESCE(@s4_booth_2, @s4_booth_1);
SET @s4_booth_3 := COALESCE(@s4_booth_3, @s4_booth_1);
SET @s4_booth_4 := COALESCE(@s4_booth_4, @s4_booth_1);

SET @s4_current_program_id := 9403001;
SET @s4_candidate_a_id := 9403002;
SET @s4_candidate_b_id := 9403003;
SET @s4_candidate_c_id := 9403004;

INSERT INTO event_program (
  program_id, event_id, category, program_title, description,
  start_at, end_at, booth_id, image_url, capacity, throughput_per_min, created_at
) VALUES
(
  @s4_current_program_id, @s4_event_id, 'EXPERIENCE', 'SIM-S4-CURRENT-HOT',
  'Synthetic current program for recommendation threshold test',
  DATE_SUB(@s4_now, INTERVAL 20 MINUTE), DATE_ADD(@s4_now, INTERVAL 120 MINUTE),
  @s4_booth_1, NULL, 60, 1.00, @s4_now
),
(
  @s4_candidate_a_id, @s4_event_id, 'EXPERIENCE', 'SIM-S4-CANDIDATE-A',
  'Synthetic candidate A for recommendation threshold test',
  DATE_SUB(@s4_now, INTERVAL 5 MINUTE), DATE_ADD(@s4_now, INTERVAL 150 MINUTE),
  @s4_booth_2, NULL, 80, 2.40, @s4_now
),
(
  @s4_candidate_b_id, @s4_event_id, 'EXPERIENCE', 'SIM-S4-CANDIDATE-B',
  'Synthetic candidate B for recommendation threshold test',
  DATE_ADD(@s4_now, INTERVAL 5 MINUTE), DATE_ADD(@s4_now, INTERVAL 170 MINUTE),
  @s4_booth_3, NULL, 85, 2.60, @s4_now
),
(
  @s4_candidate_c_id, @s4_event_id, 'EXPERIENCE', 'SIM-S4-CANDIDATE-C',
  'Synthetic candidate C for recommendation threshold test',
  DATE_ADD(@s4_now, INTERVAL 10 MINUTE), DATE_ADD(@s4_now, INTERVAL 180 MINUTE),
  @s4_booth_4, NULL, 90, 2.80, @s4_now
)
ON DUPLICATE KEY UPDATE
  event_id = VALUES(event_id),
  category = VALUES(category),
  program_title = VALUES(program_title),
  description = VALUES(description),
  start_at = VALUES(start_at),
  end_at = VALUES(end_at),
  booth_id = VALUES(booth_id),
  capacity = VALUES(capacity),
  throughput_per_min = VALUES(throughput_per_min),
  created_at = VALUES(created_at);

DROP TEMPORARY TABLE IF EXISTS tmp_s4_users;
CREATE TEMPORARY TABLE tmp_s4_users AS
SELECT
  u.user_id,
  ROW_NUMBER() OVER (ORDER BY u.user_id) AS rn
FROM users u
ORDER BY u.user_id
LIMIT 300;

-- Current program: many active applies + many immediate check-ins
INSERT INTO event_program_apply (
  program_apply_id, program_id, user_id, pet_id, image_url, admin_pet_name, status,
  ticket_no, eta_min, notified_at, checked_in_at, created_at, cancelled_at
)
SELECT
  940400000 + rn AS program_apply_id,
  @s4_current_program_id AS program_id,
  user_id,
  NULL,
  NULL,
  NULL,
  'APPLIED',
  CONCAT('S4CURA', LPAD(rn, 4, '0')),
  30,
  NULL,
  NULL,
  DATE_SUB(@s4_now, INTERVAL 40 MINUTE),
  NULL
FROM tmp_s4_users
WHERE rn BETWEEN 1 AND 120
ON DUPLICATE KEY UPDATE
  status = VALUES(status),
  eta_min = VALUES(eta_min),
  checked_in_at = VALUES(checked_in_at),
  created_at = VALUES(created_at),
  cancelled_at = VALUES(cancelled_at);

INSERT INTO event_program_apply (
  program_apply_id, program_id, user_id, pet_id, image_url, admin_pet_name, status,
  ticket_no, eta_min, notified_at, checked_in_at, created_at, cancelled_at
)
SELECT
  940410000 + rn AS program_apply_id,
  @s4_current_program_id AS program_id,
  user_id,
  NULL,
  NULL,
  NULL,
  'CHECKED_IN',
  CONCAT('S4CURC', LPAD(rn, 4, '0')),
  0,
  @s4_now,
  DATE_SUB(@s4_now, INTERVAL 20 SECOND),
  DATE_SUB(@s4_now, INTERVAL 10 MINUTE),
  NULL
FROM tmp_s4_users
WHERE rn BETWEEN 121 AND 170
ON DUPLICATE KEY UPDATE
  status = VALUES(status),
  notified_at = VALUES(notified_at),
  checked_in_at = VALUES(checked_in_at),
  created_at = VALUES(created_at),
  cancelled_at = VALUES(cancelled_at);

-- Candidate A: moderate
INSERT INTO event_program_apply (
  program_apply_id, program_id, user_id, pet_id, image_url, admin_pet_name, status,
  ticket_no, eta_min, notified_at, checked_in_at, created_at, cancelled_at
)
SELECT
  940420000 + rn AS program_apply_id,
  @s4_candidate_a_id,
  user_id,
  NULL,
  NULL,
  NULL,
  'APPLIED',
  CONCAT('S4CAA', LPAD(rn, 4, '0')),
  12,
  NULL,
  NULL,
  DATE_SUB(@s4_now, INTERVAL 25 MINUTE),
  NULL
FROM tmp_s4_users
WHERE rn BETWEEN 171 AND 205
ON DUPLICATE KEY UPDATE
  status = VALUES(status),
  eta_min = VALUES(eta_min),
  checked_in_at = VALUES(checked_in_at),
  created_at = VALUES(created_at),
  cancelled_at = VALUES(cancelled_at);

INSERT INTO event_program_apply (
  program_apply_id, program_id, user_id, pet_id, image_url, admin_pet_name, status,
  ticket_no, eta_min, notified_at, checked_in_at, created_at, cancelled_at
)
SELECT
  940430000 + rn AS program_apply_id,
  @s4_candidate_a_id,
  user_id,
  NULL,
  NULL,
  NULL,
  'CHECKED_IN',
  CONCAT('S4CAC', LPAD(rn, 4, '0')),
  0,
  @s4_now,
  DATE_SUB(@s4_now, INTERVAL 30 SECOND),
  DATE_SUB(@s4_now, INTERVAL 8 MINUTE),
  NULL
FROM tmp_s4_users
WHERE rn BETWEEN 206 AND 210
ON DUPLICATE KEY UPDATE
  status = VALUES(status),
  notified_at = VALUES(notified_at),
  checked_in_at = VALUES(checked_in_at),
  created_at = VALUES(created_at),
  cancelled_at = VALUES(cancelled_at);

-- Candidate B: low
INSERT INTO event_program_apply (
  program_apply_id, program_id, user_id, pet_id, image_url, admin_pet_name, status,
  ticket_no, eta_min, notified_at, checked_in_at, created_at, cancelled_at
)
SELECT
  940440000 + rn AS program_apply_id,
  @s4_candidate_b_id,
  user_id,
  NULL,
  NULL,
  NULL,
  'APPLIED',
  CONCAT('S4CBA', LPAD(rn, 4, '0')),
  10,
  NULL,
  NULL,
  DATE_SUB(@s4_now, INTERVAL 20 MINUTE),
  NULL
FROM tmp_s4_users
WHERE rn BETWEEN 211 AND 240
ON DUPLICATE KEY UPDATE
  status = VALUES(status),
  eta_min = VALUES(eta_min),
  checked_in_at = VALUES(checked_in_at),
  created_at = VALUES(created_at),
  cancelled_at = VALUES(cancelled_at);

INSERT INTO event_program_apply (
  program_apply_id, program_id, user_id, pet_id, image_url, admin_pet_name, status,
  ticket_no, eta_min, notified_at, checked_in_at, created_at, cancelled_at
)
SELECT
  940450000 + rn AS program_apply_id,
  @s4_candidate_b_id,
  user_id,
  NULL,
  NULL,
  NULL,
  'CHECKED_IN',
  CONCAT('S4CBC', LPAD(rn, 4, '0')),
  0,
  @s4_now,
  DATE_SUB(@s4_now, INTERVAL 35 SECOND),
  DATE_SUB(@s4_now, INTERVAL 7 MINUTE),
  NULL
FROM tmp_s4_users
WHERE rn BETWEEN 241 AND 244
ON DUPLICATE KEY UPDATE
  status = VALUES(status),
  notified_at = VALUES(notified_at),
  checked_in_at = VALUES(checked_in_at),
  created_at = VALUES(created_at),
  cancelled_at = VALUES(cancelled_at);

-- Candidate C: lower
INSERT INTO event_program_apply (
  program_apply_id, program_id, user_id, pet_id, image_url, admin_pet_name, status,
  ticket_no, eta_min, notified_at, checked_in_at, created_at, cancelled_at
)
SELECT
  940460000 + rn AS program_apply_id,
  @s4_candidate_c_id,
  user_id,
  NULL,
  NULL,
  NULL,
  'APPLIED',
  CONCAT('S4CCA', LPAD(rn, 4, '0')),
  8,
  NULL,
  NULL,
  DATE_SUB(@s4_now, INTERVAL 15 MINUTE),
  NULL
FROM tmp_s4_users
WHERE rn BETWEEN 245 AND 280
ON DUPLICATE KEY UPDATE
  status = VALUES(status),
  eta_min = VALUES(eta_min),
  checked_in_at = VALUES(checked_in_at),
  created_at = VALUES(created_at),
  cancelled_at = VALUES(cancelled_at);

INSERT INTO event_program_apply (
  program_apply_id, program_id, user_id, pet_id, image_url, admin_pet_name, status,
  ticket_no, eta_min, notified_at, checked_in_at, created_at, cancelled_at
)
SELECT
  940470000 + rn AS program_apply_id,
  @s4_candidate_c_id,
  user_id,
  NULL,
  NULL,
  NULL,
  'CHECKED_IN',
  CONCAT('S4CCC', LPAD(rn, 4, '0')),
  0,
  @s4_now,
  DATE_SUB(@s4_now, INTERVAL 40 SECOND),
  DATE_SUB(@s4_now, INTERVAL 6 MINUTE),
  NULL
FROM tmp_s4_users
WHERE rn BETWEEN 281 AND 284
ON DUPLICATE KEY UPDATE
  status = VALUES(status),
  notified_at = VALUES(notified_at),
  checked_in_at = VALUES(checked_in_at),
  created_at = VALUES(created_at),
  cancelled_at = VALUES(cancelled_at);

-- Wait pressure tuning for threshold behavior
INSERT INTO experience_waits (wait_id, program_id, wait_count, wait_min, updated_at) VALUES
  (940500001, @s4_current_program_id, 220, 35, @s4_now),
  (940500002, @s4_candidate_a_id, 35, 6, @s4_now),
  (940500003, @s4_candidate_b_id, 28, 5, @s4_now),
  (940500004, @s4_candidate_c_id, 20, 4, @s4_now)
ON DUPLICATE KEY UPDATE
  wait_count = VALUES(wait_count),
  wait_min = VALUES(wait_min),
  updated_at = VALUES(updated_at);

-- Small real-time inflow hint for the current program booth
INSERT INTO qr_logs (log_id, qr_id, booth_id, check_type, checked_at)
WITH RECURSIVE seq AS (
  SELECT 1 AS n
  UNION ALL
  SELECT n + 1 FROM seq WHERE n < 25
)
SELECT
  941000000 + n AS log_id,
  @s4_qr_id AS qr_id,
  @s4_booth_1 AS booth_id,
  'CHECKIN' AS check_type,
  DATE_SUB(@s4_now, INTERVAL (55 - n) SECOND) AS checked_at
FROM seq
ON DUPLICATE KEY UPDATE
  qr_id = VALUES(qr_id),
  booth_id = VALUES(booth_id),
  check_type = VALUES(check_type),
  checked_at = VALUES(checked_at);

DROP TEMPORARY TABLE IF EXISTS tmp_s4_users;
DROP TEMPORARY TABLE IF EXISTS tmp_s4_booths;

COMMIT;
