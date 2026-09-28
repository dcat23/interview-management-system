-- Baseline schema: squashes the former V1–V15 migrations into a single initial script.

-- ---------------------------------------------------------------------------
-- Enums
-- ---------------------------------------------------------------------------

CREATE TYPE user_role AS ENUM ('candidate', 'marketer', 'supporter', 'admin');

CREATE TYPE process_status AS ENUM ('active', 'completed', 'withdrawn', 'cancelled');

CREATE TYPE session_status AS ENUM (
    'scheduled',
    'in_review',
    'passed',
    'rejected',
    'no_show',
    'cancelled',
    'rescheduled'
);

CREATE TYPE change_source AS ENUM ('manual', 'background_job');

CREATE TYPE api_key_scope AS ENUM ('ai_agent');

-- ---------------------------------------------------------------------------
-- Users
-- ---------------------------------------------------------------------------

CREATE TABLE users (
    id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    name          varchar(255) NOT NULL,
    email         varchar(255) NOT NULL UNIQUE,
    password_hash varchar(255) NOT NULL,
    role          user_role    NOT NULL,
    is_active     boolean      NOT NULL DEFAULT true,
    created_at    timestamptz  NOT NULL DEFAULT now(),
    updated_at    timestamptz  NOT NULL DEFAULT now()
);

CREATE INDEX idx_users_email  ON users (email);
CREATE INDEX idx_users_role   ON users (role);
CREATE INDEX idx_users_active ON users (is_active);

-- ---------------------------------------------------------------------------
-- End clients
-- ---------------------------------------------------------------------------

CREATE TABLE end_clients (
    id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    name       varchar(255) NOT NULL,
    industry   varchar(255),
    is_active  boolean      NOT NULL DEFAULT true,
    created_at timestamptz  NOT NULL DEFAULT now(),
    updated_at timestamptz  NOT NULL DEFAULT now()
);

CREATE INDEX idx_end_clients_active ON end_clients (is_active);

-- ---------------------------------------------------------------------------
-- Interview processes
-- ---------------------------------------------------------------------------

CREATE TABLE interview_processes (
    id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    candidate_id  uuid           NOT NULL REFERENCES users (id),
    end_client_id uuid           NOT NULL REFERENCES end_clients (id),
    marketer_id   uuid           NOT NULL REFERENCES users (id),
    technology    varchar(255)   NOT NULL,
    description   text,
    status        process_status NOT NULL DEFAULT 'active',
    started_at    timestamptz    NOT NULL DEFAULT now(),
    closed_at     timestamptz,
    created_at    timestamptz    NOT NULL DEFAULT now(),
    updated_at    timestamptz    NOT NULL DEFAULT now(),
    job_id        varchar(50)
);

CREATE INDEX idx_processes_candidate  ON interview_processes (candidate_id);
CREATE INDEX idx_processes_client     ON interview_processes (end_client_id);
CREATE INDEX idx_processes_marketer   ON interview_processes (marketer_id);
CREATE INDEX idx_processes_status     ON interview_processes (status);
CREATE INDEX idx_processes_started_at ON interview_processes (started_at);
CREATE INDEX idx_processes_job_id     ON interview_processes (job_id);

-- Enforces the app-layer matching key at the DB level; only applies when job_id is known
CREATE UNIQUE INDEX uq_processes_candidate_client_job
    ON interview_processes (candidate_id, end_client_id, job_id)
    WHERE job_id IS NOT NULL;

-- ---------------------------------------------------------------------------
-- Interview sessions
-- ---------------------------------------------------------------------------

CREATE TABLE interview_sessions (
    id                uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    process_id        uuid           NOT NULL REFERENCES interview_processes (id),
    supporter_id      uuid           NOT NULL REFERENCES users (id),
    round             varchar(100)   NOT NULL,
    mode              varchar(100)   NOT NULL,
    duration_minutes  int            NOT NULL CHECK (duration_minutes > 0),
    description       text,
    status            session_status NOT NULL DEFAULT 'scheduled',
    scheduled_at      timestamptz    NOT NULL,
    status_changed_at timestamptz,
    status_changed_by uuid REFERENCES users (id),
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

-- ---------------------------------------------------------------------------
-- Questions
-- ---------------------------------------------------------------------------

CREATE TABLE questions (
    id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    end_client_id uuid         NOT NULL REFERENCES end_clients (id),
    topic         varchar(255) NOT NULL,
    round         varchar(100) NOT NULL,
    body          text         NOT NULL,
    version       int          NOT NULL DEFAULT 1,
    is_active     boolean      NOT NULL DEFAULT true,
    search_vector tsvector,
    created_by    uuid         NOT NULL REFERENCES users (id),
    updated_by    uuid REFERENCES users (id),
    created_at    timestamptz  NOT NULL DEFAULT now(),
    updated_at    timestamptz  NOT NULL DEFAULT now()
);

CREATE INDEX idx_questions_client       ON questions (end_client_id);
CREATE INDEX idx_questions_topic        ON questions (topic);
CREATE INDEX idx_questions_round        ON questions (round);
CREATE INDEX idx_questions_active       ON questions (is_active);
CREATE INDEX idx_questions_client_topic ON questions (end_client_id, topic);
CREATE INDEX idx_questions_search       ON questions USING gin (search_vector);

CREATE OR REPLACE FUNCTION questions_search_vector_update()
    RETURNS trigger AS
$$
BEGIN
    NEW.search_vector :=
            setweight(to_tsvector('english', coalesce(NEW.topic, '')), 'A') ||
            setweight(to_tsvector('english', coalesce(NEW.body, '')), 'B');
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER questions_search_vector_trigger
    BEFORE INSERT OR UPDATE
    ON questions
    FOR EACH ROW
EXECUTE FUNCTION questions_search_vector_update();

CREATE TABLE question_versions (
    id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    question_id uuid         NOT NULL REFERENCES questions (id),
    version     int          NOT NULL,
    topic       varchar(255) NOT NULL,
    round       varchar(100) NOT NULL,
    body        text         NOT NULL,
    updated_by  uuid REFERENCES users (id),
    created_at  timestamptz  NOT NULL DEFAULT now()
);

CREATE INDEX idx_question_versions_question ON question_versions (question_id);
CREATE INDEX idx_question_versions_version  ON question_versions (question_id, version);

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

-- ---------------------------------------------------------------------------
-- Feedback
-- ---------------------------------------------------------------------------

CREATE TABLE feedback (
    id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
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

-- ---------------------------------------------------------------------------
-- Status history
-- ---------------------------------------------------------------------------

CREATE TABLE status_history (
    id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    session_id    uuid           NOT NULL REFERENCES interview_sessions (id),
    from_status   session_status,
    to_status     session_status NOT NULL,
    changed_by    uuid REFERENCES users (id),
    change_source change_source  NOT NULL,
    changed_at    timestamptz    NOT NULL DEFAULT now()
);

CREATE INDEX idx_status_history_session    ON status_history (session_id);
CREATE INDEX idx_status_history_changed_at ON status_history (changed_at);

-- ---------------------------------------------------------------------------
-- API keys
-- ---------------------------------------------------------------------------

CREATE TABLE api_keys (
    id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    owner_id     uuid          NOT NULL REFERENCES users (id),
    name         varchar(255)  NOT NULL,
    key_prefix   varchar(12)   NOT NULL,
    key_hash     varchar(64)   NOT NULL UNIQUE,
    scope        api_key_scope NOT NULL DEFAULT 'ai_agent',
    revoked      boolean       NOT NULL DEFAULT false,
    revoked_at   timestamptz,
    expires_at   timestamptz   NOT NULL,
    last_used_at timestamptz,
    created_at   timestamptz   NOT NULL DEFAULT now()
);

CREATE INDEX idx_api_keys_owner    ON api_keys (owner_id);
CREATE INDEX idx_api_keys_key_hash ON api_keys (key_hash);
CREATE INDEX idx_api_keys_revoked  ON api_keys (revoked);
