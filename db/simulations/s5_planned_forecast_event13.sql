-- Scenario 5: Planned-event forecast stress
-- Goal: Increase pre-open demand signals for event_id=13 (PLANNED).
-- Inputs emphasized: active applies + congestion policy baseline.

START TRANSACTION;

SET @s5_event_id := 13;
SET @s5_now := NOW();

-- Keep target event in PLANNED state for pre-open forecast validation.
UPDATE event
SET status = 'PLANNED'
WHERE event_id = @s5_event_id;

INSERT INTO event_congestion_policy (
  event_id, capacity_baseline, wait_baseline, target_wait_min, created_at, updated_at
)
VALUES (
  @s5_event_id, 1800, 450, 20, @s5_now, @s5_now
)
ON DUPLICATE KEY UPDATE
  capacity_baseline = VALUES(capacity_baseline),
  wait_baseline = VALUES(wait_baseline),
  target_wait_min = VALUES(target_wait_min),
  updated_at = VALUES(updated_at);

DROP TEMPORARY TABLE IF EXISTS tmp_s5_users;
CREATE TEMPORARY TABLE tmp_s5_users AS
SELECT
  u.user_id,
  ROW_NUMBER() OVER (ORDER BY u.user_id) AS rn
FROM users u
LEFT JOIN event_apply ea
  ON ea.user_id = u.user_id
 AND ea.event_id = @s5_event_id
 AND ea.status IN ('APPLIED', 'APPROVED')
WHERE ea.apply_id IS NULL
ORDER BY u.user_id
LIMIT 900;

-- APPLIED pool
INSERT INTO event_apply (apply_id, user_id, event_id, applied_at, status)
SELECT
  950130000 + rn AS apply_id,
  user_id,
  @s5_event_id AS event_id,
  DATE_SUB(@s5_now, INTERVAL (600 - rn) MINUTE) AS applied_at,
  'APPLIED' AS status
FROM tmp_s5_users
WHERE rn BETWEEN 1 AND 600
ON DUPLICATE KEY UPDATE
  applied_at = VALUES(applied_at),
  status = VALUES(status);

-- APPROVED pool
INSERT INTO event_apply (apply_id, user_id, event_id, applied_at, status)
SELECT
  950131000 + rn AS apply_id,
  user_id,
  @s5_event_id AS event_id,
  DATE_SUB(@s5_now, INTERVAL (900 - rn) MINUTE) AS applied_at,
  'APPROVED' AS status
FROM tmp_s5_users
WHERE rn BETWEEN 601 AND 780
ON DUPLICATE KEY UPDATE
  applied_at = VALUES(applied_at),
  status = VALUES(status);

-- Churn rows (non-active) to keep data shape realistic.
INSERT INTO event_apply (apply_id, user_id, event_id, applied_at, status)
SELECT
  950132000 + rn AS apply_id,
  user_id,
  @s5_event_id AS event_id,
  DATE_SUB(@s5_now, INTERVAL (1200 - rn) MINUTE) AS applied_at,
  'CANCELLED' AS status
FROM tmp_s5_users
WHERE rn BETWEEN 781 AND 860
ON DUPLICATE KEY UPDATE
  applied_at = VALUES(applied_at),
  status = VALUES(status);

DROP TEMPORARY TABLE IF EXISTS tmp_s5_users;

COMMIT;
