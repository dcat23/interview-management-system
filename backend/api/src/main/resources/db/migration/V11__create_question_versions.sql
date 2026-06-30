CREATE TABLE question_versions (
    id          uuid         PRIMARY KEY DEFAULT gen_random_uuid(),
    question_id uuid         NOT NULL REFERENCES questions (id),
    version     int          NOT NULL,
    topic       varchar(255) NOT NULL,
    round       varchar(100) NOT NULL,
    body        text         NOT NULL,
    updated_by  uuid         REFERENCES users (id),
    created_at  timestamptz  NOT NULL DEFAULT now()
);

CREATE INDEX idx_question_versions_question ON question_versions (question_id);
CREATE INDEX idx_question_versions_version  ON question_versions (question_id, version);
