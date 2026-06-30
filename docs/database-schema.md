# Database Schema

PostgreSQL 16 on AWS RDS Multi-AZ. All migrations managed by Flyway (`apps/api/src/main/resources/db/migration/`).

## Conventions

- Primary keys: `uuid` generated via `gen_random_uuid()`
- Timestamps: `timestamptz` stored in UTC
- Soft deletes: `is_active boolean DEFAULT true` (no hard deletes on core entities)
- All foreign keys have explicit indexes
- Enum types defined as PostgreSQL `CREATE TYPE`

---

## Enum types

```sql
CREATE TYPE user_role AS ENUM ('candidate', 'marketer', 'supporter', 'admin');

CREATE TYPE process_status AS ENUM ('active', 'completed', 'withdrawn', 'cancelled');

CREATE TYPE session_status AS ENUM (
  'scheduled',
  'in_review',
  'passed',
  'rejected',
  'no_show',
  'cancelled'
);

CREATE TYPE change_source AS ENUM ('manual', 'background_job');
```

---

## Tables

### `users`

```sql
CREATE TABLE users (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name         varchar(255)        NOT NULL,
  email        varchar(255)        NOT NULL UNIQUE,
  password_hash varchar(255)       NOT NULL,
  role         user_role           NOT NULL,
  is_active    boolean             NOT NULL DEFAULT true,
  created_at   timestamptz         NOT NULL DEFAULT now(),
  updated_at   timestamptz         NOT NULL DEFAULT now()
);

CREATE INDEX idx_users_email    ON users(email);
CREATE INDEX idx_users_role     ON users(role);
CREATE INDEX idx_users_active   ON users(is_active);
```

**Notes:**
- `password_hash` stores BCrypt hash only. Plain text never persisted.
- `is_active = false` disables login without deleting the record. All historical session/feedback references remain intact.

---

### `end_clients`

```sql
CREATE TABLE end_clients (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name       varchar(255)  NOT NULL,
  industry   varchar(255),
  is_active  boolean       NOT NULL DEFAULT true,
  created_at timestamptz   NOT NULL DEFAULT now(),
  updated_at timestamptz   NOT NULL DEFAULT now()
);

CREATE INDEX idx_end_clients_active ON end_clients(is_active);
```

---

### `interview_processes`

One record per candidate–client engagement. Parent of all sessions in that engagement.

```sql
CREATE TABLE interview_processes (
  id             uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  candidate_id   uuid          NOT NULL REFERENCES users(id),
  end_client_id  uuid          NOT NULL REFERENCES end_clients(id),
  marketer_id    uuid          NOT NULL REFERENCES users(id),
  technology     varchar(255)  NOT NULL,
  description    text,
  status         process_status NOT NULL DEFAULT 'active',
  started_at     timestamptz   NOT NULL DEFAULT now(),
  closed_at      timestamptz,
  created_at     timestamptz   NOT NULL DEFAULT now(),
  updated_at     timestamptz   NOT NULL DEFAULT now()
);

CREATE INDEX idx_processes_candidate   ON interview_processes(candidate_id);
CREATE INDEX idx_processes_client      ON interview_processes(end_client_id);
CREATE INDEX idx_processes_marketer    ON interview_processes(marketer_id);
CREATE INDEX idx_processes_status      ON interview_processes(status);
CREATE INDEX idx_processes_started_at  ON interview_processes(started_at);
```

**Notes:**
- `technology` is free text (e.g. "Java Full Stack", "React / Node.js") — not an enum. Controlled vocabulary can be introduced later via a lookup table without schema changes.
- `closed_at` is set when status transitions to `completed`, `withdrawn`, or `cancelled`.

---

### `interview_sessions`

One record per interview round within a process.

```sql
CREATE TABLE interview_sessions (
  id                 uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  process_id         uuid           NOT NULL REFERENCES interview_processes(id),
  supporter_id       uuid           NOT NULL REFERENCES users(id),
  round              varchar(100)   NOT NULL,
  mode               varchar(100)   NOT NULL,
  duration_minutes   int            NOT NULL CHECK (duration_minutes > 0),
  description        text,
  status             session_status NOT NULL DEFAULT 'scheduled',
  scheduled_at       timestamptz    NOT NULL,
  status_changed_at  timestamptz,
  status_changed_by  uuid           REFERENCES users(id),  -- NULL if background job
  created_at         timestamptz    NOT NULL DEFAULT now(),
  updated_at         timestamptz    NOT NULL DEFAULT now()
);

CREATE INDEX idx_sessions_process       ON interview_sessions(process_id);
CREATE INDEX idx_sessions_supporter     ON interview_sessions(supporter_id);
CREATE INDEX idx_sessions_status        ON interview_sessions(status);
CREATE INDEX idx_sessions_scheduled_at  ON interview_sessions(scheduled_at);

-- Composite: background job query (scheduled sessions past their date)
CREATE INDEX idx_sessions_job_query
  ON interview_sessions(status, scheduled_at)
  WHERE status = 'scheduled';
```

**Notes:**
- `round` is free text (e.g. "1st round", "technical screen", "final"). Matches `questions.round` for filtering.
- `mode` is free text (e.g. "Microsoft Teams", "Zoom", "On-site", "Phone"). Not an enum — client preferences vary.
- `status_changed_by` is `NULL` when the background job performs the transition.
- The partial index `idx_sessions_job_query` optimises the background job's query significantly at scale.

---

### `questions`

Question bank. Questions are scoped to an end client, topic, and round.

```sql
CREATE TABLE questions (
  id             uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  end_client_id  uuid          NOT NULL REFERENCES end_clients(id),
  topic          varchar(255)  NOT NULL,
  round          varchar(100)  NOT NULL,
  body           text          NOT NULL,
  version        int           NOT NULL DEFAULT 1,
  is_active      boolean       NOT NULL DEFAULT true,
  search_vector  tsvector,
  created_by     uuid          NOT NULL REFERENCES users(id),
  updated_by     uuid          REFERENCES users(id),
  created_at     timestamptz   NOT NULL DEFAULT now(),
  updated_at     timestamptz   NOT NULL DEFAULT now()
);

CREATE INDEX idx_questions_client        ON questions(end_client_id);
CREATE INDEX idx_questions_topic         ON questions(topic);
CREATE INDEX idx_questions_round         ON questions(round);
CREATE INDEX idx_questions_active        ON questions(is_active);
CREATE INDEX idx_questions_client_topic  ON questions(end_client_id, topic);
CREATE INDEX idx_questions_search        ON questions USING GIN(search_vector);

-- Auto-update search_vector on insert/update
CREATE OR REPLACE FUNCTION questions_search_vector_update() RETURNS trigger AS $$
BEGIN
  NEW.search_vector :=
    setweight(to_tsvector('english', coalesce(NEW.topic, '')), 'A') ||
    setweight(to_tsvector('english', coalesce(NEW.body,  '')), 'B');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER questions_search_vector_trigger
  BEFORE INSERT OR UPDATE ON questions
  FOR EACH ROW EXECUTE FUNCTION questions_search_vector_update();
```

**Notes:**
- `version` is incremented server-side on any change to `body`. Provides a lightweight audit trail without a separate version history table.
- `search_vector` is maintained by trigger. Full-text search uses `@@ to_tsquery(...)` against this column.
- Topic weighted `A` (higher relevance), body weighted `B` in search ranking.

---

### `session_questions`

Join table linking questions from the bank to a specific session.

```sql
CREATE TABLE session_questions (
  id             uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id     uuid  NOT NULL REFERENCES interview_sessions(id) ON DELETE CASCADE,
  question_id    uuid  NOT NULL REFERENCES questions(id),
  display_order  int   NOT NULL DEFAULT 0,
  notes          text,
  created_at     timestamptz NOT NULL DEFAULT now(),

  CONSTRAINT uq_session_question UNIQUE (session_id, question_id)
);

CREATE INDEX idx_session_questions_session  ON session_questions(session_id);
CREATE INDEX idx_session_questions_question ON session_questions(question_id);
```

**Notes:**
- `ON DELETE CASCADE` on `session_id` — removing a session removes its question links. The questions themselves remain in the bank.
- `display_order` determines question sequence shown to candidate in prep view.
- `notes` are supporter-only internal annotations. Not visible to candidates.

---

### `feedback`

One feedback record per session. Supports draft (`is_submitted = false`) and submitted (`is_submitted = true`) states.

```sql
CREATE TABLE feedback (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id    uuid    NOT NULL UNIQUE REFERENCES interview_sessions(id),
  supporter_id  uuid    NOT NULL REFERENCES users(id),
  body          text    NOT NULL DEFAULT '',
  is_submitted  boolean NOT NULL DEFAULT false,
  submitted_at  timestamptz,
  updated_at    timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_feedback_session    ON feedback(session_id);
CREATE INDEX idx_feedback_supporter  ON feedback(supporter_id);
CREATE INDEX idx_feedback_submitted  ON feedback(is_submitted);
```

**Notes:**
- `UNIQUE` on `session_id` enforces one feedback record per session.
- `body` becomes read-only once `is_submitted = true` — enforced at the application layer.
- `submitted_at` set server-side on submission. Nullable until then.

---

### `status_history`

Immutable audit log of every session status transition.

```sql
CREATE TABLE status_history (
  id             uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id     uuid          NOT NULL REFERENCES interview_sessions(id),
  from_status    session_status,              -- NULL on initial creation
  to_status      session_status NOT NULL,
  changed_by     uuid          REFERENCES users(id),  -- NULL if background job
  change_source  change_source NOT NULL,
  changed_at     timestamptz   NOT NULL DEFAULT now()
);

CREATE INDEX idx_status_history_session    ON status_history(session_id);
CREATE INDEX idx_status_history_changed_at ON status_history(changed_at);
```

**Notes:**
- `from_status` is `NULL` for the initial `scheduled` entry created when a session is first persisted.
- `changed_by` is `NULL` when `change_source = 'background_job'`.
- Records are never updated or deleted. Append-only.

---

## Status transition rules

Enforced at the application layer in `SessionStatusTransitionService`. The database stores the result; the service validates the transition before writing.

```
scheduled  → in_review   (marketer, supporter, or background job)
scheduled  → cancelled   (marketer, admin)
scheduled  → no_show     (supporter, marketer, admin)
in_review  → passed      (supporter, marketer, admin)
in_review  → rejected    (supporter, marketer, admin)
in_review  → no_show     (supporter, marketer, admin)
in_review  → cancelled   (admin)
```

Any other transition returns HTTP 409.

---

## Flyway migration naming

```
V1__create_enums.sql
V2__create_users.sql
V3__create_end_clients.sql
V4__create_interview_processes.sql
V5__create_interview_sessions.sql
V6__create_questions.sql
V7__create_session_questions.sql
V8__create_feedback.sql
V9__create_status_history.sql
V10__add_search_vector_trigger.sql
```

---

## Backup and retention

- **RDS automated backups:** 7-day retention in dev, 30-day in staging and prod.
- **Point-in-time recovery:** Enabled on all environments.
- **Manual snapshots:** Taken before every production deployment.
- **Data retention policy:** No hard deletes. `is_active = false` for logical removal. `status_history` and `feedback` records are permanent.
