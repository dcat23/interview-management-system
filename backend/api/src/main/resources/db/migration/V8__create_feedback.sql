CREATE TABLE feedback (
    id           uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
    session_id   uuid        NOT NULL UNIQUE REFERENCES interview_sessions (id),
    supporter_id uuid        NOT NULL REFERENCES users (id),
    body         text        NOT NULL DEFAULT '',
    is_submitted boolean     NOT NULL DEFAULT false,
    submitted_at timestamptz,
    updated_at   timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_feedback_session   ON feedback (session_id);
CREATE INDEX idx_feedback_supporter ON feedback (supporter_id);
CREATE INDEX idx_feedback_submitted ON feedback (is_submitted);
