CREATE TABLE questions (
    id            uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
    end_client_id uuid        NOT NULL REFERENCES end_clients (id),
    topic         varchar(255) NOT NULL,
    round         varchar(100) NOT NULL,
    body          text         NOT NULL,
    version       int          NOT NULL DEFAULT 1,
    is_active     boolean      NOT NULL DEFAULT true,
    search_vector tsvector,
    created_by    uuid         NOT NULL REFERENCES users (id),
    updated_by    uuid         REFERENCES users (id),
    created_at    timestamptz  NOT NULL DEFAULT now(),
    updated_at    timestamptz  NOT NULL DEFAULT now()
);

CREATE INDEX idx_questions_client       ON questions (end_client_id);
CREATE INDEX idx_questions_topic        ON questions (topic);
CREATE INDEX idx_questions_round        ON questions (round);
CREATE INDEX idx_questions_active       ON questions (is_active);
CREATE INDEX idx_questions_client_topic ON questions (end_client_id, topic);
CREATE INDEX idx_questions_search       ON questions USING GIN (search_vector);
