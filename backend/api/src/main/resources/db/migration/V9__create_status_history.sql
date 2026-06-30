CREATE TABLE status_history (
    id            uuid          PRIMARY KEY DEFAULT gen_random_uuid(),
    session_id    uuid          NOT NULL REFERENCES interview_sessions (id),
    from_status   session_status,
    to_status     session_status NOT NULL,
    changed_by    uuid          REFERENCES users (id),
    change_source change_source  NOT NULL,
    changed_at    timestamptz   NOT NULL DEFAULT now()
);

CREATE INDEX idx_status_history_session    ON status_history (session_id);
CREATE INDEX idx_status_history_changed_at ON status_history (changed_at);
