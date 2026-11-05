-- Topic-specific assessment configuration and server-authoritative attempts.
-- Apply to the D1 database before enabling the student assessment API.
ALTER TABLE exams ADD COLUMN lesson_id TEXT REFERENCES lessons(id);
ALTER TABLE exams ADD COLUMN question_count INTEGER NOT NULL DEFAULT 10 CHECK (question_count BETWEEN 1 AND 50);
ALTER TABLE exams ADD COLUMN penalty_seconds INTEGER NOT NULL DEFAULT 30 CHECK (penalty_seconds BETWEEN 0 AND 600);
ALTER TABLE exam_attempts ADD COLUMN deadline_at INTEGER NOT NULL DEFAULT 0;
ALTER TABLE exam_attempts ADD COLUMN question_order_json TEXT NOT NULL DEFAULT '[]';
ALTER TABLE exam_attempts ADD COLUMN answers_json TEXT NOT NULL DEFAULT '{}';
ALTER TABLE exam_attempts ADD COLUMN result_json TEXT NOT NULL DEFAULT '{}';
ALTER TABLE exam_attempts ADD COLUMN departure_count INTEGER NOT NULL DEFAULT 0;
ALTER TABLE exam_attempts ADD COLUMN penalty_seconds_applied INTEGER NOT NULL DEFAULT 0;
ALTER TABLE exam_attempts ADD COLUMN recovery_used INTEGER NOT NULL DEFAULT 0;
UPDATE exam_attempts
SET deadline_at = CAST(strftime('%s', started_at) AS INTEGER) +
  COALESCE((SELECT duration_seconds FROM exams WHERE exams.id = exam_attempts.exam_id), 0)
WHERE deadline_at = 0;
CREATE UNIQUE INDEX IF NOT EXISTS idx_exams_lesson_unique
  ON exams(lesson_id) WHERE lesson_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_attempts_exam_user_status
  ON exam_attempts(exam_id, google_sub, status, started_at);
CREATE TABLE IF NOT EXISTS exam_integrity_events (
  id TEXT PRIMARY KEY,
  attempt_id TEXT NOT NULL REFERENCES exam_attempts(id) ON DELETE CASCADE,
  event_key TEXT NOT NULL,
  event_type TEXT NOT NULL CHECK (event_type IN ('visibility_hidden', 'technical_recovery')),
  departure_number INTEGER,
  penalty_seconds INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  applied_at TEXT,
  UNIQUE(attempt_id, event_key)
);
CREATE INDEX IF NOT EXISTS idx_integrity_attempt_created
  ON exam_integrity_events(attempt_id, created_at);
