# API Reference

Base URL: `https://api.{domain}/v1`

All endpoints require `Authorization: Bearer {access_token}` unless marked **public**.

Responses are `application/json`. Errors follow the standard error envelope below.

---

## Error envelope

```json
{
  "error": {
    "code": "INVALID_STATUS_TRANSITION",
    "message": "Cannot transition from 'cancelled' to 'scheduled'",
    "status": 409,
    "timestamp": "2024-01-15T10:30:00Z"
  }
}
```

### Common HTTP status codes

| Code | Meaning |
|---|---|
| `200` | Success |
| `201` | Created |
| `400` | Validation error — see `error.message` for field details |
| `401` | Missing or invalid JWT |
| `403` | Authenticated but insufficient role |
| `404` | Resource not found |
| `409` | Conflict — duplicate resource or invalid state transition |
| `429` | Rate limit exceeded |
| `500` | Internal server error |

---

## Role reference

| Badge | Role |
|---|---|
| `admin` | Admin |
| `marketer` | Marketer |
| `supporter` | Interview supporter |
| `candidate` | Candidate |

---

## Authentication

### `POST /auth/login` · public

Authenticate and receive tokens.

**Request**
```json
{
  "email": "user@example.com",
  "password": "string"
}
```

**Response `200`**
```json
{
  "access_token": "eyJ...",
  "refresh_token": "eyJ...",
  "role": "supporter",
  "expires_in": 3600
}
```

---

### `POST /auth/refresh` · public

Rotate access token using a valid refresh token.

**Request**
```json
{ "refresh_token": "eyJ..." }
```

**Response `200`**
```json
{ "access_token": "eyJ...", "expires_in": 3600 }
```

---

### `POST /auth/logout` · all roles

Invalidate the current refresh token. Access token expires naturally after TTL.

**Response `204`** No content.

---

## Users

### `GET /users` · `admin`

List users with optional filters.

**Query params**

| Param | Type | Description |
|---|---|---|
| `role` | string | Filter by role |
| `is_active` | boolean | Default `true` |
| `page` | int | Default `1` |
| `limit` | int | Default `20`, max `100` |

**Response `200`**
```json
{
  "data": [
    {
      "id": "uuid",
      "name": "string",
      "email": "string",
      "role": "supporter",
      "is_active": true,
      "created_at": "2024-01-15T10:00:00Z"
    }
  ],
  "total": 42,
  "page": 1,
  "limit": 20
}
```

---

### `POST /users` · `admin`

Create a new user.

**Request**
```json
{
  "name": "Jane Smith",
  "email": "jane@example.com",
  "password": "string (min 12 chars)",
  "role": "candidate | marketer | supporter | admin"
}
```

**Response `201`** — returns created user object.

---

### `GET /users/:id` · `admin` `self`

Get user by ID. Non-admin users may only fetch their own profile.

**Response `200`** — returns user object.

---

### `PATCH /users/:id` · `admin`

Update user fields.

**Request** (all fields optional)
```json
{
  "name": "string",
  "email": "string",
  "role": "string",
  "is_active": false
}
```

**Response `200`** — returns updated user object.

---

## End clients

### `GET /clients` · `admin` `marketer` `supporter`

List end clients.

**Query params:** `is_active` (boolean, default `true`), `page`, `limit`

**Response `200`**
```json
{
  "data": [
    { "id": "uuid", "name": "string", "industry": "string", "is_active": true }
  ],
  "total": 10,
  "page": 1,
  "limit": 20
}
```

---

### `POST /clients` · `admin` `marketer`

**Request**
```json
{ "name": "Acme Corp", "industry": "Financial Services" }
```

**Response `201`** — returns created client object.

---

### `PATCH /clients/:id` · `admin` `marketer`

**Request** (all fields optional)
```json
{ "name": "string", "industry": "string", "is_active": false }
```

**Response `200`** — returns updated client object.

---

## Question bank

### `GET /questions` · `admin` `supporter`

Query questions with filters and full-text search.

**Query params**

| Param | Type | Description |
|---|---|---|
| `client_id` | uuid | Filter by end client |
| `topic` | string | Filter by topic |
| `round` | string | Filter by round |
| `q` | string | Full-text search across topic and body |
| `is_active` | boolean | Default `true` |
| `page` | int | Default `1` |
| `limit` | int | Default `20`, max `100` |
| `sort` | string | e.g. `created_at:desc`, `topic:asc` |

**Response `200`**
```json
{
  "data": [
    {
      "id": "uuid",
      "end_client_id": "uuid",
      "topic": "Spring Boot",
      "round": "technical screen",
      "body": "Explain the difference between @Component and @Bean.",
      "version": 2,
      "is_active": true,
      "created_by": "uuid",
      "created_at": "2024-01-10T09:00:00Z"
    }
  ],
  "total": 80,
  "page": 1,
  "limit": 20
}
```

---

### `POST /questions` · `admin` `supporter`

Create a question in the bank.

**Request**
```json
{
  "end_client_id": "uuid",
  "topic": "string",
  "round": "string",
  "body": "string"
}
```

`created_by` set from JWT. `version` defaults to `1`.

**Response `201`** — returns created question object.

---

### `GET /questions/:id` · `admin` `supporter`

Get a single question including version and authorship metadata.

**Response `200`** — returns full question object.

---

### `PATCH /questions/:id` · `admin`

Update question content. Increments `version` if `body` changes.

**Request** (all fields optional)
```json
{
  "topic": "string",
  "round": "string",
  "body": "string",
  "is_active": false
}
```

`updated_by` set from JWT server-side.

**Response `200`** — returns updated question object.

---

## Interview processes

### `GET /processes` · `admin` `marketer`

List interview processes with filters.

**Query params**

| Param | Type | Description |
|---|---|---|
| `candidate_id` | uuid | Filter by candidate |
| `client_id` | uuid | Filter by end client |
| `status` | string | `active`, `completed`, `withdrawn`, `cancelled` |
| `technology` | string | Partial match |
| `page` | int | Default `1` |
| `limit` | int | Default `20` |
| `sort` | string | e.g. `started_at:desc` |

**Response `200`**
```json
{
  "data": [
    {
      "id": "uuid",
      "candidate": { "id": "uuid", "name": "string" },
      "end_client": { "id": "uuid", "name": "string" },
      "marketer": { "id": "uuid", "name": "string" },
      "technology": "Java Full Stack",
      "description": "string",
      "status": "active",
      "started_at": "2024-01-01T00:00:00Z",
      "session_count": 3
    }
  ],
  "total": 15,
  "page": 1,
  "limit": 20
}
```

---

### `POST /processes` · `admin` `marketer`

Open a new interview process for a candidate.

**Request**
```json
{
  "candidate_id": "uuid",
  "end_client_id": "uuid",
  "technology": "string",
  "description": "string (optional)"
}
```

`marketer_id` set from JWT. `status` defaults to `active`. `started_at` set server-side.

**Response `201`** — returns created process object.

---

### `GET /processes/:id` · `admin` `marketer` `supporter` `candidate`

Get process with nested sessions ordered by `scheduled_at` ascending.

**Role-based response differences:**
- **Candidate:** own process only, sessions list without feedback
- **Supporter:** assigned sessions only, own feedback included
- **Admin / marketer:** full detail including feedback summary per session

**Response `200`**
```json
{
  "id": "uuid",
  "candidate": { "id": "uuid", "name": "string" },
  "end_client": { "id": "uuid", "name": "string" },
  "technology": "string",
  "status": "active",
  "sessions": [
    {
      "id": "uuid",
      "round": "1st round",
      "scheduled_at": "2024-02-01T14:00:00Z",
      "status": "passed",
      "mode": "Microsoft Teams",
      "duration_minutes": 60
    }
  ]
}
```

---

### `PATCH /processes/:id` · `admin` `marketer`

Update process-level fields or close the process.

**Request** (all fields optional)
```json
{
  "technology": "string",
  "description": "string",
  "status": "completed | withdrawn | cancelled",
  "closed_at": "2024-03-01T00:00:00Z"
}
```

**Response `200`** — returns updated process object.

---

### `GET /processes/:id/timeline` · `admin` `marketer`

Full progression view: all rounds with outcomes, question counts, and feedback status.

**Response `200`**
```json
{
  "process_id": "uuid",
  "candidate": { "id": "uuid", "name": "string" },
  "technology": "string",
  "rounds": [
    {
      "session_id": "uuid",
      "round": "1st round",
      "scheduled_at": "2024-02-01T14:00:00Z",
      "status": "passed",
      "supporter": { "id": "uuid", "name": "string" },
      "questions_count": 8,
      "feedback_submitted": true,
      "status_changed_at": "2024-02-01T15:30:00Z",
      "status_changed_by": "uuid | null"
    }
  ]
}
```

---

### `GET /processes/:id/feedback` · `admin` `marketer`

All submitted feedback across all rounds in a process, ordered by `scheduled_at` ascending.

**Response `200`**
```json
{
  "process_id": "uuid",
  "feedback": [
    {
      "session_id": "uuid",
      "round": "1st round",
      "scheduled_at": "2024-02-01T14:00:00Z",
      "supporter": { "id": "uuid", "name": "string" },
      "body": "string",
      "submitted_at": "2024-02-01T15:45:00Z"
    }
  ]
}
```

---

## Interview sessions

### `GET /processes/:id/sessions` · `admin` `marketer` `supporter` `candidate`

List sessions within a process.

**Query params:** `status`, `round`, `sort` (default `scheduled_at:asc`), `page`, `limit`

**Role constraints:**
- Candidate: own sessions only, no feedback
- Supporter: assigned sessions only
- Admin / marketer: all sessions

---

### `POST /processes/:id/sessions` · `admin` `marketer`

Schedule a new round within a process.

**Request**
```json
{
  "supporter_id": "uuid",
  "round": "1st round",
  "mode": "Microsoft Teams",
  "duration_minutes": 60,
  "scheduled_at": "2024-02-15T14:00:00Z",
  "description": "string (optional)"
}
```

`status` defaults to `scheduled`. `process_id` from route param.

**Response `201`** — returns created session object. Also writes initial `STATUS_HISTORY` entry.

---

### `GET /sessions/:id` · `admin` `marketer` `supporter` `candidate`

Get session detail.

**Role-based response differences:**
- Candidate: questions (body only), schedule info. No feedback, no status history.
- Supporter: questions with notes, own feedback (draft or submitted).
- Admin / marketer: full detail including feedback and status history.

---

### `PATCH /sessions/:id` · `admin` `marketer`

Update session logistics fields.

**Request** (all fields optional)
```json
{
  "supporter_id": "uuid",
  "round": "string",
  "mode": "string",
  "duration_minutes": 90,
  "scheduled_at": "2024-02-20T10:00:00Z",
  "description": "string"
}
```

**Response `200`** — returns updated session object.

---

### `PATCH /sessions/:id/status` · `admin` `marketer` `supporter`

Transition session status. Role constraints enforced server-side.

**Request**
```json
{ "status": "in_review | passed | rejected | no_show | cancelled" }
```

**Role constraints**

| Role | Permitted transitions |
|---|---|
| `marketer` | `scheduled → cancelled`, `scheduled → in_review` |
| `supporter` | `scheduled → no_show`, `scheduled → in_review`, `in_review → passed`, `in_review → rejected`, `in_review → no_show` |
| `admin` | Any valid transition |

Returns `409` if the transition is not permitted from the current status.

Writes to `status_history`. Sets `status_changed_by` from JWT and `status_changed_at` to `now()`.

**Response `200`**
```json
{
  "session_id": "uuid",
  "previous_status": "scheduled",
  "current_status": "in_review",
  "changed_by": "uuid",
  "changed_at": "2024-02-15T15:00:00Z"
}
```

---

### `GET /sessions/:id/status-history` · `admin` `marketer`

Full audit trail of all status transitions for a session.

**Response `200`**
```json
{
  "session_id": "uuid",
  "history": [
    {
      "from_status": null,
      "to_status": "scheduled",
      "changed_by": { "id": "uuid", "name": "string" },
      "change_source": "manual",
      "changed_at": "2024-01-20T09:00:00Z"
    },
    {
      "from_status": "scheduled",
      "to_status": "in_review",
      "changed_by": null,
      "change_source": "background_job",
      "changed_at": "2024-02-15T15:00:00Z"
    }
  ]
}
```

---

## Session questions

### `GET /sessions/:id/questions` · `admin` `supporter` `candidate`

Get questions linked to a session, ordered by `display_order`.

**Role-based response:**
- Candidate: `id`, `topic`, `round`, `body` only
- Supporter / admin: full object including `notes`

---

### `POST /sessions/:id/questions` · `admin` `supporter`

Link a question from the bank to this session.

**Request**
```json
{
  "question_id": "uuid",
  "display_order": 1,
  "notes": "string (optional)"
}
```

Returns `409` if the question is already linked to this session.

**Response `201`** — returns `SESSION_QUESTION` object.

---

### `PATCH /sessions/:id/questions/:question_id` · `admin` `supporter`

Update display order or notes for a linked question.

**Request** (all fields optional)
```json
{ "display_order": 2, "notes": "string" }
```

**Response `200`** — returns updated `SESSION_QUESTION` object.

---

### `DELETE /sessions/:id/questions/:question_id` · `admin` `supporter`

Unlink a question from a session. The question remains in the bank.

**Response `204`** No content.

---

## Feedback

### `GET /sessions/:id/feedback` · `admin` `supporter`

Get feedback for a session.

- Supporter: own feedback only (draft or submitted)
- Admin: any submitted feedback

Returns `404` if no feedback record exists yet.

---

### `POST /sessions/:id/feedback` · `supporter`

Create a feedback draft.

**Request**
```json
{ "body": "string" }
```

`supporter_id` set from JWT. `is_submitted` defaults to `false`.

Returns `409` if a feedback record already exists — use `PATCH` to update.

**Response `201`** — returns feedback object.

---

### `PATCH /sessions/:id/feedback` · `supporter`

Update or submit feedback.

**Request** (all fields optional)
```json
{
  "body": "string",
  "is_submitted": true
}
```

Once `is_submitted = true`, `body` becomes read-only. `submitted_at` set server-side on submission.

**Response `200`** — returns updated feedback object.

---

## Pagination envelope

All list endpoints return:

```json
{
  "data": [],
  "total": 100,
  "page": 1,
  "limit": 20
}
```

---

## Rate limiting

| Scope | Limit |
|---|---|
| `POST /auth/login` | 10 requests / minute per IP |
| All other endpoints | 300 requests / minute per user |

Rate limit headers returned on every response:
```
X-RateLimit-Limit: 300
X-RateLimit-Remaining: 287
X-RateLimit-Reset: 1705312800
```

---

## Versioning

API is versioned via URL prefix (`/v1/`). Breaking changes increment the version. Non-breaking additions (new optional fields, new endpoints) are added without version increment.
