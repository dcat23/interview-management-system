CREATE TABLE interview_sessions (
    id                uuid           PRIMARY KEY DEFAULT gen_random_uuid(),
    process_id        uuid           NOT NULL REFERENCES interview_processes (id),
    supporter_id      uuid           NOT NULL REFERENCES users (id),
    round             varchar(100)   NOT NULL,
    mode              varchar(100)   NOT NULL,
    duration_minutes  int            NOT NULL CHECK (duration_minutes > 0),
    description       text,
    status            session_status NOT NULL DEFAULT 'scheduled',
    scheduled_at      timestamptz    NOT NULL,
    status_changed_at timestamptz,
    status_changed_by uuid           REFERENCES users (id),
    created_at        timestamptz    NOT NULL DEFAULT now(),
    updated_at        timestamptz    NOT NULL DEFAULT now()
);

CREATE INDEX idx_sessions_process      ON interview_sessions (process_id);
CREATE INDEX idx_sessions_supporter    ON interview_sessions (supporter_id);
CREATE INDEX idx_sessions_status       ON interview_sessions (status);
CREATE INDEX idx_sessions_scheduled_at ON interview_sessions (scheduled_at);

CREATE INDEX idx_sessions_job_query
    ON interview_sessions (status, scheduled_at)
    WHERE status = 'scheduled';
