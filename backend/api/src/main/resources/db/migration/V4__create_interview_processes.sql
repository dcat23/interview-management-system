CREATE TABLE interview_processes (
    id            uuid           PRIMARY KEY DEFAULT gen_random_uuid(),
    candidate_id  uuid           NOT NULL REFERENCES users (id),
    end_client_id uuid           NOT NULL REFERENCES end_clients (id),
    marketer_id   uuid           NOT NULL REFERENCES users (id),
    technology    varchar(255)   NOT NULL,
    description   text,
    status        process_status NOT NULL DEFAULT 'active',
    started_at    timestamptz    NOT NULL DEFAULT now(),
    closed_at     timestamptz,
    created_at    timestamptz    NOT NULL DEFAULT now(),
    updated_at    timestamptz    NOT NULL DEFAULT now()
);

CREATE INDEX idx_processes_candidate  ON interview_processes (candidate_id);
CREATE INDEX idx_processes_client     ON interview_processes (end_client_id);
CREATE INDEX idx_processes_marketer   ON interview_processes (marketer_id);
CREATE INDEX idx_processes_status     ON interview_processes (status);
CREATE INDEX idx_processes_started_at ON interview_processes (started_at);
