UPDATE interview_processes p
SET started_at = earliest.scheduled_at
FROM (
    SELECT process_id, MIN(scheduled_at) AS scheduled_at
    FROM interview_sessions
    GROUP BY process_id
) earliest
WHERE p.id = earliest.process_id
  AND p.started_at IS DISTINCT FROM earliest.scheduled_at;