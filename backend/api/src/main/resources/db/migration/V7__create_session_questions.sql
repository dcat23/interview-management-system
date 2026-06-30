CREATE TABLE session_questions (
    id            uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
    session_id    uuid        NOT NULL REFERENCES interview_sessions (id) ON DELETE CASCADE,
    question_id   uuid        NOT NULL REFERENCES questions (id),
    display_order int         NOT NULL DEFAULT 0,
    notes         text,
    created_at    timestamptz NOT NULL DEFAULT now(),

    CONSTRAINT uq_session_question UNIQUE (session_id, question_id)
);

CREATE INDEX idx_session_questions_session  ON session_questions (session_id);
CREATE INDEX idx_session_questions_question ON session_questions (question_id);
