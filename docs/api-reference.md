# API Reference

Base URL: `https://api.{domain}/v1`

All endpoints require `Authorization: Bearer {accessToken}` unless marked **public**.

Responses are `application/json`. Errors follow the standard error envelope below.

---

## Error envelope

```json
{
  "error": {
    "code": "INVALID_STATUS_TRANSITION",
    "message": "Cannot transition from 'CANCELLED' to 'SCHEDULED'",
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
  "accessToken": "eyJ...",
  "refreshToken": "eyJ...",
  "role": "supporter",
  "expiresIn": 3600
}
```

`role` is always lowercase (e.g., `admin`, `marketer`, `supporter`, `candidate`).

---

### `POST /auth/refresh` · public

Rotate access token using a valid refresh token.

**Request**
```json
{ "refreshToken": "eyJ..." }
```

**Response `200`**
```json
{ "accessToken": "eyJ...", "expiresIn": 3600 }
```

---

### `POST /auth/logout` · all roles

Invalidate the current refresh token. Access token expires naturally after TTL.

**Query param:** `refreshToken` (optional)

**Response `204`** No content.

---

## Users

### `GET /users` · `admin`

List users with optional filters.

**Query params**

| Param | Type | Description |
|---|---|---|
| `role` | string | Filter by role (`ADMIN`, `MARKETER`, `SUPPORTER`, `CANDIDATE`) |
| `isActive` | boolean | Default `true` |
| `page` | int | Default `0` |
| `limit` | int | Default `20` |

**Response `200`**
```json
{
  "data": [
    {
      "id": "uuid",
      "name": "string",
      "email": "string",
      "role": "SUPPORTER",
      "isActive": true,
      "createdAt": "2024-01-15T10:00:00Z"
    }
  ],
  "total": 42,
  "page": 0,
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
  "role": "CANDIDATE | MARKETER | SUPPORTER | ADMIN"
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
  "isActive": false
}
```

**Response `200`** — returns updated user object.

---

## End clients

### `GET /clients` · `admin` `marketer` `supporter`

List end clients.

**Query params:** `isActive` (boolean, default `true`), `page`, `limit`

**Response `200`**
```json
{
  "data": [
    { "id": "uuid", "name": "string", "industry": "string", "isActive": true }
  ],
  "total": 10,
  "page": 0,
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
{ "name": "string", "industry": "string", "isActive": false }
```

**Response `200`** — returns updated client object.

---

## Question bank

### `GET /questions` · `admin` `marketer` `supporter`

List active questions with optional filters.

**Query params**

| Param | Type | Description |
|---|---|---|
| `clientId` | uuid | Filter by end client |
| `topic` | string | Partial match on topic |
| `page` | int | Default `0` |
| `limit` | int | Default `20` |

**Response `200`**
```json
{
  "data": [
    {
      "id": "uuid",
      "clientId": "uuid",
      "topic": "Spring Boot",
      "round": "Technical Screen",
      "body": "Explain the difference between @Component and @Bean.",
      "version": 2,
      "active": true,
      "createdBy": "uuid",
      "updatedBy": "uuid",
      "createdAt": "2024-01-10T09:00:00Z",
      "updatedAt": "2024-01-20T11:00:00Z"
    }
  ],
  "total": 80,
  "page": 0,
  "limit": 20
}
```

---

### `POST /questions` · `admin`

Create a question in the bank. `createdBy` set from JWT. `version` defaults to `1`.

**Request**
```json
{
  "clientId": "uuid",
  "topic": "string",
  "round": "string",
  "body": "string"
}
```

**Response `201`** — returns created question object.

---

### `GET /questions/:id` · `admin` `marketer` `supporter`

Get a single question including version history metadata.

**Response `200`** — returns full question object.

---

### `PATCH /questions/:id` · `admin`

Update question content. Always increments `version` on save. `updatedBy` set from JWT. Previous version is archived in `question_versions`.

**Request** (all fields optional)
```json
{
  "topic": "string",
  "round": "string",
  "body": "string"
}
```

**Response `200`** — returns updated question object.

---

### `DELETE /questions/:id` · `admin`

Soft-delete a question. Sets `active = false`. The question remains in the database and linked to existing sessions.

**Response `204`** No content.

---

## Interview processes

### `GET /processes` · `admin` `marketer` `candidate`

List interview processes.

**Query params:** `page` (default `0`), `limit` (default `20`)

**Role constraints:**
- Candidate: own processes only (filtered automatically by JWT identity)
- Admin / marketer: all processes

**Response `200`**
```json
{
  "data": [
    {
      "id": "uuid",
      "candidateId": "uuid",
      "clientId": "uuid",
      "marketerId": "uuid",
      "technology": "Java Full Stack",
      "description": "string",
      "status": "ACTIVE",
      "startedAt": "2024-01-01T00:00:00Z",
      "closedAt": null,
      "createdAt": "2024-01-01T00:00:00Z",
      "updatedAt": "2024-01-15T12:00:00Z"
    }
  ],
  "total": 15,
  "page": 0,
  "limit": 20
}
```

`status` values: `ACTIVE`, `COMPLETED`, `WITHDRAWN`, `CANCELLED`

---

### `POST /processes` · `admin` `marketer`

Open a new interview process for a candidate.

**Request**
```json
{
  "candidateId": "uuid",
  "clientId": "uuid",
  "marketerId": "uuid",
  "technology": "string",
  "description": "string (optional)"
}
```

`status` defaults to `ACTIVE`. `startedAt` set server-side.

**Response `201`** — returns created process object.

---

### `GET /processes/:id` · `admin` `marketer` `supporter` `candidate`

Get process by ID.

**Role constraints:**
- Candidate: own process only
- Admin / marketer / supporter: any process

**Response `200`** — returns process object (same shape as list item).

---

### `PATCH /processes/:id` · `admin` `marketer`

Update process-level fields or close the process.

**Request** (all fields optional)
```json
{
  "technology": "string",
  "description": "string",
  "status": "COMPLETED | WITHDRAWN | CANCELLED",
  "closedAt": "2024-03-01T00:00:00Z"
}
```

**Response `200`** — returns updated process object.

---

### `GET /processes/:id/timeline` · `admin` `marketer`

Full progression view: all rounds with outcomes, question counts, and feedback status.

**Response `200`**
```json
{
  "processId": "uuid",
  "technology": "string",
  "rounds": [
    {
      "sessionId": "uuid",
      "round": "1st round",
      "scheduledAt": "2024-02-01T14:00:00Z",
      "status": "PASSED",
      "supporterId": "uuid",
      "questionsCount": 8,
      "feedbackSubmitted": true,
      "statusChangedAt": "2024-02-01T15:30:00Z",
      "statusChangedBy": "uuid"
    }
  ]
}
```

---

### `GET /processes/:id/feedback` · `admin` `marketer`

All submitted feedback across all rounds in a process, ordered by `scheduledAt` ascending.

**Response `200`**
```json
{
  "processId": "uuid",
  "feedback": [
    {
      "sessionId": "uuid",
      "round": "1st round",
      "scheduledAt": "2024-02-01T14:00:00Z",
      "supporterId": "uuid",
      "body": "string",
      "submittedAt": "2024-02-01T15:45:00Z"
    }
  ]
}
```

---

## Interview sessions

### `GET /processes/:id/sessions` · `admin` `marketer` `supporter` `candidate`

List sessions within a process.

**Role constraints:**
- Candidate: own process only; denied 403 if the process does not belong to them
- Supporter: own assigned sessions only
- Admin / marketer: all sessions

**Response `200`** — array of session objects.

```json
[
  {
    "id": "uuid",
    "processId": "uuid",
    "supporterId": "uuid",
    "round": "1st round",
    "mode": "Microsoft Teams",
    "durationMinutes": 60,
    "description": "string",
    "status": "SCHEDULED",
    "scheduledAt": "2024-02-15T14:00:00Z",
    "statusChangedAt": null,
    "statusChangedBy": null,
    "createdAt": "2024-01-20T09:00:00Z",
    "updatedAt": "2024-01-20T09:00:00Z"
  }
]
```

---

### `POST /processes/:id/sessions` · `admin` `marketer`

Schedule a new round within a process.

**Request**
```json
{
  "supporterId": "uuid",
  "round": "1st round",
  "mode": "Microsoft Teams",
  "durationMinutes": 60,
  "scheduledAt": "2024-02-15T14:00:00Z",
  "description": "string (optional)"
}
```

`status` defaults to `SCHEDULED`.

**Response `201`** — returns created session object.

---

### `GET /sessions/:id` · `admin` `marketer` `supporter` `candidate`

Get session by ID.

**Role constraints:**
- Supporter: own assigned sessions only
- Candidate: sessions belonging to their own process only
- Admin / marketer: any session

**Response `200`** — returns session object.

---

### `PATCH /sessions/:id` · `admin` `marketer`

Update session logistics fields.

**Request** (all fields optional)
```json
{
  "supporterId": "uuid",
  "round": "string",
  "mode": "string",
  "durationMinutes": 90,
  "scheduledAt": "2024-02-20T10:00:00Z",
  "description": "string"
}
```

**Response `200`** — returns updated session object.

---

### `PATCH /sessions/:id/status` · `admin` `marketer` `supporter`

Transition session status. Role constraints are enforced server-side.

**Request**
```json
{ "targetStatus": "IN_REVIEW" }
```

`targetStatus` values: `IN_REVIEW`, `PASSED`, `REJECTED`, `NO_SHOW`, `CANCELLED`

**Permitted transitions by role**

| From | To | Roles |
|---|---|---|
| `SCHEDULED` | `IN_REVIEW` | `supporter` |
| `SCHEDULED` | `CANCELLED` | `marketer`, `admin` |
| `IN_REVIEW` | `PASSED` | `supporter` |
| `IN_REVIEW` | `REJECTED` | `supporter` |
| `IN_REVIEW` | `NO_SHOW` | `supporter`, `marketer` |
| `IN_REVIEW` | `CANCELLED` | `marketer`, `admin` |

Returns `409` if the transition is not permitted from the current status.
Returns `403` if the caller's role is not permitted for the requested transition.

Writes to `status_history`. Sets `statusChangedBy` from JWT and `statusChangedAt` to `now()`.

**Response `200`** — returns the updated session object.

---

### `GET /sessions/:id/status-history` · `admin` `marketer`

Full audit trail of all status transitions for a session.

**Response `200`**
```json
{
  "sessionId": "uuid",
  "history": [
    {
      "fromStatus": null,
      "toStatus": "SCHEDULED",
      "changedBy": "uuid",
      "changeSource": "MANUAL",
      "changedAt": "2024-01-20T09:00:00Z"
    },
    {
      "fromStatus": "SCHEDULED",
      "toStatus": "IN_REVIEW",
      "changedBy": null,
      "changeSource": "BACKGROUND_JOB",
      "changedAt": "2024-02-15T15:00:00Z"
    }
  ]
}
```

`changeSource` values: `MANUAL`, `BACKGROUND_JOB`

---

## Session questions

### `GET /sessions/:id/questions` · `admin` `marketer` `supporter` `candidate`

Get questions linked to a session, ordered by `displayOrder`.

**Response `200`** — array of session-question objects.

```json
[
  {
    "id": "uuid",
    "sessionId": "uuid",
    "questionId": "uuid",
    "displayOrder": 1,
    "notes": "string",
    "createdAt": "2024-01-20T09:00:00Z"
  }
]
```

---

### `POST /sessions/:id/questions` · `admin` `supporter`

Link a question from the bank to this session.

**Role constraint:** Supporter must be the assigned supporter for this session.

**Request**
```json
{
  "questionId": "uuid",
  "displayOrder": 1,
  "notes": "string (optional)"
}
```

Returns `409` if the question is already linked to this session.
Returns `404` if the question is inactive or does not exist.

**Response `201`** — returns session-question object.

---

### `DELETE /sessions/:id/questions/:question_id` · `admin` `supporter`

Unlink a question from a session. The question remains in the bank.

**Role constraint:** Supporter must be the assigned supporter for this session.

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

`supporterId` set from JWT. `isSubmitted` defaults to `false`.

Returns `409` if a feedback record already exists — use `PATCH` to update.

**Response `201`** — returns feedback object.

---

### `PATCH /sessions/:id/feedback` · `supporter`

Update or submit feedback.

**Request** (all fields optional)
```json
{
  "body": "string",
  "isSubmitted": true
}
```

Once `isSubmitted = true`, `body` becomes read-only. `submittedAt` set server-side on submission.

**Response `200`** — returns updated feedback object.

---

## Pagination envelope

All list endpoints that return paginated results use:

```json
{
  "data": [],
  "total": 100,
  "page": 0,
  "limit": 20
}
```

`page` is zero-based. Session list (`GET /processes/:id/sessions`) returns a plain array, not a paginated envelope.

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
