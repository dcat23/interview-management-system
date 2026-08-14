# API Reference

Base URL: `https://api.{domain}/v1`

All endpoints require `Authorization: Bearer {accessToken}` unless marked **public**.

Endpoints marked `ai_agent` also accept `X-API-Key: {key}` in place of the Bearer header, or an API key's own JWT via `Authorization: Bearer {bearerToken}` — see [API keys](#api-keys).

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

| Code  | Meaning                                                   |
|-------|-----------------------------------------------------------|
| `200` | Success                                                   |
| `201` | Created                                                   |
| `400` | Validation error — see `error.message` for field details  |
| `401` | Missing or invalid JWT                                    |
| `403` | Authenticated but insufficient role                       |
| `404` | Resource not found                                        |
| `409` | Conflict — duplicate resource or invalid state transition |
| `429` | Rate limit exceeded                                       |
| `500` | Internal server error                                     |

---

## Role reference

| Badge       | Role                                                                                                                                                     |
|-------------|----------------------------------------------------------------------------------------------------------------------------------------------------------|
| `admin`     | Admin                                                                                                                                                    |
| `marketer`  | Marketer                                                                                                                                                 |
| `supporter` | Interview supporter                                                                                                                                      |
| `candidate` | Candidate                                                                                                                                                |
| `ai_agent`  | MCP-capable AI client authenticated via `X-API-Key` or an API key's bearer JWT, resolved to the issuing supporter's identity — see [API keys](#api-keys) |

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

### `GET /auth/me` · all roles

Returns full profile details for the authenticated user (real `id`, `name`, `email`, `role`, `active`, `createdAt`) — used to enrich a client session with the real user id instead of an email-as-id placeholder.

**Response `200`**
```json
{
  "id": "uuid",
  "name": "string",
  "email": "string",
  "role": "supporter",
  "active": true,
  "createdAt": "2024-01-15T10:00:00Z"
}
```

---

### `PATCH /auth/me` · all roles

Partially updates the authenticated user's own `name`/`email`. Role and active status can only be changed by an admin via `PATCH /users/:id`.

**Request** (all fields optional)
```json
{
  "name": "string",
  "email": "string"
}
```

Returns `409` if the email is already in use by another user.

**Response `200`** — returns updated profile (same shape as `GET /auth/me`).

---

## API keys

Lets a supporter issue a key an MCP-capable AI client (Claude Desktop, claude.ai, Perplexity) can use to call this API directly during a live interview, in place of a JWT. A key resolves to its issuing supporter's identity but carries only the `ai_agent` role — never the supporter's own role — so it can reach the `ai_agent`-marked endpoints above regardless of what the supporter could otherwise do, and nothing else.

Issuance returns two forms of the same key: `key` (raw, for `X-API-Key`) and `bearerToken` (a JWT wrapping the same key's id, for `Authorization: Bearer` — the transport hosted MCP connector UIs that only expose a bearer-token field, like Perplexity's, expect). Use whichever your client supports; both authenticate identically.

### `POST /api-keys` · `admin` `supporter`

Issue a new key, owned by the caller.

**Request**
```json
{
  "name": "Claude Desktop",
  "expiresInDays": 90
}
```

`expiresInDays` optional — defaults to `90`, capped at `180`.

**Response `201`**
```json
{
  "id": "uuid",
  "name": "Claude Desktop",
  "keyPrefix": "aik_XXXXXXXX",
  "key": "aik_...",
  "bearerToken": "eyJhbGciOiJIUzI1NiJ9...",
  "expiresAt": "2026-11-10T00:00:00Z",
  "createdAt": "2026-08-12T00:00:00Z"
}
```

`key` and `bearerToken` are two transports for the same credential — returned exactly once, in this response, and never retrievable again. `key` is the raw, plaintext key for the `X-API-Key` header; only its SHA-256 hash is persisted. `bearerToken` is a JWT wrapping this key's id for the `Authorization: Bearer` header; it isn't persisted at all — it's self-verifying and re-checked against this row (for revocation) on every request.

---

### `GET /api-keys` · `admin` `supporter`

List the caller's own keys.

**Response `200`**
```json
[
  {
    "id": "uuid",
    "name": "Claude Desktop",
    "keyPrefix": "aik_XXXXXXXX",
    "scope": "AI_AGENT",
    "revoked": false,
    "revokedAt": null,
    "expiresAt": "2026-11-10T00:00:00Z",
    "lastUsedAt": "2026-08-12T09:30:00Z",
    "createdAt": "2026-08-12T00:00:00Z"
  }
]
```

Never includes the hash or raw key.

---

### `DELETE /api-keys/:id` · `admin` `owner`

Soft-revokes a key (`revoked = true`, `revokedAt` set) so it can no longer authenticate. Owner or admin — an admin can kill a leaked key even if the owning supporter is unavailable.

**Response `204`** No content.

---

## MCP server

An [MCP](https://modelcontextprotocol.io) server (Spring AI, SSE transport) mounted alongside the REST API, for hosted connectors (Claude Desktop, claude.ai, Perplexity) to call the backend live from a chat instead of a human clicking through the dashboard. Authenticated the same way as any `ai_agent` REST call — `X-API-Key` or an API key's `bearerToken` — see [API keys](#api-keys). No separate credential or setup.

| Endpoint          | Purpose                                                          |
|--------------------|-------------------------------------------------------------------|
| `GET /mcp/sse`      | Opens the SSE connection; the client lists tools over it.       |
| `POST /mcp/message` | Tool-call request/response channel paired with an SSE session.  |

Both endpoints sit behind the same security chain as the rest of the API — an unauthenticated or invalid-credential connection attempt gets `401`, before any tool is listed.

Each tool is a thin adapter straight onto the existing service layer, in-process — no internal HTTP hop — so `@PreAuthorize` enforcement and per-item partial-success behavior are identical to the equivalent REST call. The surface is deliberately narrow: lookups plus question-capture only. Delete/unlink, question update, status transitions, feedback, and user/client mutation are not exposed as tools.

### Lookup tools (read-only)

| Tool                    | Equivalent REST call                       | Notes                                                                 |
|--------------------------|---------------------------------------------|------------------------------------------------------------------------|
| `search_clients`         | `GET /clients`                             | Free-text on name/industry, or omit for most-recently-active. Capped at 20. |
| `search_candidates`      | `GET /users/lookup?role=CANDIDATE`         | Name search. Capped at 20.                                             |
| `search_sessions`        | `GET /sessions`                            | Free-text + optional `status`/`scheduledFrom`/`scheduledTo`. Capped at 20. |
| `get_session`            | `GET /sessions/:id`                        | Fetch one session by id.                                               |
| `search_questions`       | `GET /questions?q=`                        | Full-text, optionally scoped to a `clientId`. Capped at 20.            |
| `list_session_questions` | `GET /sessions/:id/questions`              | All questions already linked to a session, in display order.           |

### Write tools

| Tool                     | Equivalent REST call                        | Notes                                                                |
|---------------------------|-----------------------------------------------|------------------------------------------------------------------------|
| `add_questions_to_session` | `POST /sessions/:id/questions/bulk`         | Creates and links a batch in one call; per-item partial success, same as the REST endpoint. |
| `link_existing_question`   | `POST /sessions/:id/questions`              | Links a question already in the bank — call `search_questions` first to avoid a duplicate. |

Tool descriptions steer the agent to search before creating: `search_questions`/`list_session_questions` to check for an existing match, `link_existing_question` over `add_questions_to_session` when one is found.

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

### `GET /users/lookup` · `admin` `marketer` `supporter` `ai_agent`

Case-insensitive partial name search, e.g. resolving "the candidate named Sarah" to an id from an AI agent chat. Returns a minimal `id`/`name`/`role` projection — deliberately excludes email, active status, and every other field to keep this agent-facing surface low-exposure. Unlike `GET /users`, this is not admin-only.

**Query params**

| Param   | Type   | Description                                              |
|---------|--------|------------------------------------------------------------|
| `query` | string | Required. Partial, case-insensitive match on name.          |
| `role`  | string | Optional filter (`ADMIN`, `MARKETER`, `SUPPORTER`, `CANDIDATE`). Omit to search all roles. |

Results are capped at 20, sorted by name — not paginated.

**Response `200`**
```json
[
  { "id": "uuid", "name": "Sarah Connor", "role": "CANDIDATE" }
]
```

---

## Candidates

Minimal, name-only candidate lookups for display purposes (e.g. rendering a candidate's name on a process/session card). Deliberately separate from `GET /users/:id`, which is admin/self-only — marketer and supporter need candidate names but must not gain general user-lookup access.

### `GET /candidates` · `admin` `marketer` `supporter`

List candidates, paginated.

**Query params:** `ids` (optional, repeatable — filter to a specific set of candidate ids for batch name resolution), `page` (default `0`), `limit` (default `20`)

**Response `200`**
```json
{
  "data": [
    { "id": "uuid", "name": "string" }
  ],
  "total": 15,
  "page": 0,
  "limit": 20
}
```

---

### `GET /candidates/:id` · `admin` `marketer` `supporter`

Get a candidate by ID.

**Response `200`**
```json
{ "id": "uuid", "name": "string" }
```

Returns `404` if the id does not exist or does not belong to a user with the `CANDIDATE` role.

---

## End clients

### `GET /clients` · `admin` `marketer` `supporter` `ai_agent`

List end clients.

**Query params:**

| Param            | Notes                                                                                                                     |
|------------------|---------------------------------------------------------------------------------------------------------------------------|
| `isActive`       | Boolean, default `true`.                                                                                                  |
| `page` / `limit` | Default `0` / `20`.                                                                                                       |
| `search`         | Free text, matched (case-insensitive, substring) against name and industry.                                               |
| `sort`           | `field,asc\|desc`, repeatable. Sortable fields: `name`, `industry`, `active`, `createdAt`. Any other field returns `400`. |

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

### `GET /questions` · `admin` `marketer` `supporter` `ai_agent`

List active questions with optional filters.

**Query params**

| Param      | Type   | Description                                                          |
|------------|--------|-----------------------------------------------------------------------|
| `q`        | string | Full-text search across topic and body (PostgreSQL `plainto_tsquery`, ranked by relevance). When present, `topic` is ignored; `clientId` still applies. |
| `clientId` | uuid   | Filter by end client                                                   |
| `topic`    | string | Partial match on topic. Ignored when `q` is present.                  |
| `page`     | int    | Default `0`                                                            |
| `limit`    | int    | Default `20`                                                           |

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

### `GET /questions/:id` · `admin` `marketer` `supporter` `ai_agent`

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

### `GET /processes` · `admin` `marketer` `supporter` `candidate`

List interview processes.

**Query params:**

| Param      | Notes                                                                                                                                                                                    |
|------------|------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|
| `page`     | Default `0`.                                                                                                                                                                             |
| `limit`    | Default `20`.                                                                                                                                                                            |
| `search`   | Free text, matched (case-insensitive, substring) against candidate name, client name, technology, and job id.                                                                            |
| `status`   | Exact match: `ACTIVE`, `COMPLETED`, `WITHDRAWN`, `CANCELLED`.                                                                                                                            |
| `clientId` | Exact match on `clientId`.                                                                                                                                                               |
| `startedFrom` / `startedTo` | `yyyy-MM-dd` (plain date, no time/zone). Filters on `startedAt`, inclusive on both ends - `startedTo` covers the entire day (interpreted as UTC day boundaries). `400` if `startedFrom` is after `startedTo`. |
| `sort`     | `field,asc\|desc`, repeatable. Sortable fields: `candidateName`, `clientName`, `technology`, `status`, `startedAt`, `closedAt`, `createdAt`, `updatedAt`. Any other field returns `400`. |

**Role constraints:**
- Candidate: own processes only (filtered automatically by JWT identity) — `search`/`status`/`clientId`/date-range further narrow within that set
- Admin / marketer / supporter: all processes

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
      "jobId": "9548BR",
      "description": "string",
      "status": "ACTIVE",
      "startedAt": "2024-01-01T00:00:00Z",
      "closedAt": null,
      "createdAt": "2024-01-01T00:00:00Z",
      "updatedAt": "2024-01-15T12:00:00Z",
      "sessions": null
    }
  ],
  "total": 15,
  "page": 0,
  "limit": 20
}
```

`sessions` is always `null` here — it's only populated by `GET /processes/:id` (see below), to avoid an extra query per row.

`status` values: `ACTIVE`, `COMPLETED`, `WITHDRAWN`, `CANCELLED`

`jobId` is the requisition/job code, when known (e.g. `9548BR` extracted from a technology string like "Java Developer (9548BR)"). Nullable — not every process has one. Two processes for the same candidate + client are treated as the same engagement when their `jobId` matches; see [Schedule import](#schedule-import).

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
  "jobId": "string (optional)",
  "description": "string (optional)"
}
```

`status` defaults to `ACTIVE`. `startedAt` set server-side — initially the creation time, then kept in sync with the earliest session's `scheduledAt` once a session is created for the process (via `POST /processes/:id/sessions` or CSV import; see [Schedule import](#schedule-import)).

**Response `201`** — returns created process object.

---

### `GET /processes/:id` · `admin` `marketer` `supporter` `candidate`

Get process by ID.

**Role constraints:**
- Candidate: own process only
- Admin / marketer / supporter: any process

**Response `200`** — same shape as a list item, plus a populated `sessions` array (the process's sessions, ordered by `scheduledAt`; `[]` if none). `sessions` is `null` on list responses (`GET /processes`) to avoid an extra query per row.

---

### `PATCH /processes/:id` · `admin` `marketer`

Update process-level fields or close the process.

**Request** (all fields optional)
```json
{
  "technology": "string",
  "jobId": "string",
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

### `GET /sessions` · `admin` `marketer` `supporter` `ai_agent`

List sessions across all processes, paginated.

**Query params:**

| Param                                  | Notes                                                                                                                                                                                    |
|----------------------------------------|------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|
| `status` / `processId` / `supporterId` | Optional exact-match filters.                                                                                                                                                            |
| `page` / `limit`                       | Default `0` / `20`.                                                                                                                                                                      |
| `search`                               | Free text, matched (case-insensitive, substring) against round, mode, and description.                                                                                                   |
| `scheduledFrom` / `scheduledTo`        | `yyyy-MM-dd` (plain date, no time/zone). Filters on `scheduledAt`, inclusive on both ends - `scheduledTo` covers the entire day (interpreted as UTC day boundaries). `400` if `scheduledFrom` is after `scheduledTo`. |
| `sort`                                 | `field,asc\|desc`, repeatable. Sortable fields: `round`, `mode`, `durationMinutes`, `status`, `scheduledAt`, `statusChangedAt`, `createdAt`, `updatedAt`. Any other field returns `400`. |

**Response `200`**
```json
{
  "data": [
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
  ],
  "total": 42,
  "page": 0,
  "limit": 20
}
```

---

### `GET /processes/:id/sessions` · `admin` `marketer` `supporter` `candidate`

List sessions within a process.

**Role constraints:**
- Candidate: own process only; denied 403 if the process does not belong to them
- Admin / marketer / supporter: all sessions in the process, regardless of assignment

**Response `200`** — array of session objects, ordered by `scheduledAt`.

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

### `GET /sessions/:id` · `admin` `marketer` `supporter` `candidate` `ai_agent`

Get session by ID.

**Role constraints:**
- Candidate: sessions belonging to their own process only
- Admin / marketer / supporter / AI agent: any session, regardless of assignment — agent reads are intentionally not scoped to the issuing supporter

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

| From        | To          | Roles                   |
|-------------|-------------|-------------------------|
| `SCHEDULED` | `IN_REVIEW` | `supporter`             |
| `SCHEDULED` | `CANCELLED` | `marketer`, `admin`     |
| `IN_REVIEW` | `PASSED`    | `supporter`, `marketer` |
| `IN_REVIEW` | `REJECTED`  | `supporter`, `marketer` |
| `IN_REVIEW` | `NO_SHOW`   | `supporter`, `marketer` |
| `IN_REVIEW` | `CANCELLED` | `marketer`, `admin`     |

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

### `GET /sessions/:id/questions` · `admin` `marketer` `supporter` `candidate` `ai_agent`

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

### `POST /sessions/:id/questions` · `admin` `supporter` `ai_agent`

Link a question from the bank to this session.

**Role constraint:** Supporter must be the assigned supporter for this session. AI agent writes are **not** scoped to an assignment — an agent key can link a question to any session.

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

### `POST /sessions/:id/questions/bulk` · `admin` `supporter` `ai_agent`

Create and link a batch of new questions to this session in one call — the endpoint an AI agent's `add_questions_to_session` tool call and the REST bulk-import path both use. Each item is created and linked as its own unit of work: one bad item (unknown `clientId`, missing required field) does **not** roll back the rest of the batch.

**Role constraint:** Supporter must be the assigned supporter for this session — this endpoint does not loosen human-caller authorization. AI agent writes are **not** scoped to an assignment, same as `POST /sessions/:id/questions`.

**Request**
```json
{
  "questions": [
    {
      "clientId": "uuid",
      "topic": "string",
      "round": "string",
      "body": "string",
      "displayOrder": 1,
      "notes": "string (optional)"
    }
  ]
}
```

`questions` must be non-empty.

**Response `201`**
```json
{
  "totalItems": 5,
  "created": 4,
  "failed": 1,
  "results": [
    {
      "itemIndex": 0,
      "outcome": "CREATED",
      "questionId": "uuid",
      "sessionQuestionId": "uuid",
      "error": null
    },
    {
      "itemIndex": 2,
      "outcome": "FAILED",
      "questionId": null,
      "sessionQuestionId": null,
      "error": "Client not found: uuid"
    }
  ]
}
```

`201` is returned even when some items fail — check `results[].outcome` for per-item status.

---

### `DELETE /sessions/:id/questions/:question_id` · `admin` `supporter`

Unlink a question from a session. The question remains in the bank.

**Role constraint:** Supporter must be the assigned supporter for this session.

**Response `204`** No content.

---

## Feedback

### `GET /sessions/:id/feedback` · `admin` `marketer` `supporter`

Get feedback for a session.

- Any supporter, marketer, or admin may read the feedback for any session (view-all), regardless of who authored it.
- Only writes (`POST`/`PATCH`) are scoped to the assigned supporter — see below.

Returns `404` if no feedback record exists yet.

---

### `POST /sessions/:id/feedback` · `supporter`

Create a feedback draft. Only the session's assigned supporter may create it — returns `403` otherwise.

**Request**
```json
{ "body": "string" }
```

`supporterId` set from JWT. `isSubmitted` defaults to `false`.

Returns `409` if a feedback record already exists — use `PATCH` to update.

**Response `201`** — returns feedback object.

---

### `PATCH /sessions/:id/feedback` · `supporter`

Update or submit feedback. Only the authoring supporter may update it — returns `403` otherwise, including for admin and marketer.

**Request** (all fields optional)
```json
{
  "body": "string",
  "isSubmitted": true
}
```

Once `isSubmitted = true`, `body` becomes read-only and any further `PATCH` returns `409`. `submittedAt` set server-side on submission.

**Response `200`** — returns updated feedback object.

---

## Schedule import

### `POST /imports/interview-schedule` · `admin` `marketer` `supporter`

Bulk-imports an interview schedule CSV, reconciling it against `users`, `end_clients`, `interview_processes`, and `interview_sessions` — creating or updating each as needed instead of hand-entering rows through the endpoints above.

**Request:** `multipart/form-data`, single part named `file` (a `.csv` file).

CSV columns (header row required, in any order):

| Column              | Maps to                                                                                       |
|---------------------|-----------------------------------------------------------------------------------------------|
| `Candidate Name`    | Candidate user, matched/created by name                                                       |
| `Lead Name`         | Marketer user, matched/created by name                                                        |
| `Technology`        | `interview_processes.technology`; trailing `(...)` parsed as `jobId` when it contains a digit |
| `Interview Date`    | e.g. `01-Jul-26` (`dd-MMM-yy`)                                                                |
| `Time`              | e.g. `1 PM EST`, `2:30 PM EST` — interpreted in `America/New_York`                            |
| `Duration`          | e.g. `1 Hour`, `45 Min` — must match this shape or the row fails                              |
| `Mode of interview` | `interview_sessions.mode` (free text)                                                         |
| `Client name`       | End client, matched/created by name                                                           |
| `Interview Round`   | `interview_sessions.round` (free text)                                                        |
| `Status`            | `Scheduled`/`Reschedule` → `SCHEDULED`; anything else defaults to `SCHEDULED` with a warning  |

**Matching rules:**
- Candidate/marketer name matching is case-insensitive (falls back to first-token match). No match → an inactive placeholder user is created (`<slug>.candidate@system.local` / `<slug>.marketer@system.local`, random password) for an admin to reconcile later.
- Rows are grouped into one `interview_process` by `(candidateId, clientId, jobId)` when a job id was parsed from `Technology`; otherwise by exact `(candidateId, clientId, technology)` text match. Round order is not validated — `jobId` (not round-name sequencing) is what ties multiple rows together, and chronological order simply follows each session's `scheduledAt`.
- Sessions are upserted by `(processId, round)`: a row matching an existing session updates `scheduledAt`/`durationMinutes`/`mode` in place (covers reschedules and re-importing the same sheet) rather than duplicating.
- Supporter assignment: if the caller has the `supporter` role, they're assigned to every session they import. Otherwise a supporter is auto-assigned per session — first excluding anyone with a conflicting time window, then picking the least-loaded remaining supporter. No supporter available → that row fails.
- After each row, the process's `startedAt` is recomputed as `MIN(scheduledAt)` across its sessions — so it reflects the earliest imported round regardless of row order in the sheet, not the moment the CSV happened to be uploaded.

**Response `200`**
```json
{
  "totalRows": 53,
  "imported": 48,
  "updated": 3,
  "failed": 2,
  "results": [
    {
      "rowNumber": 2,
      "outcome": "IMPORTED",
      "candidateId": "uuid",
      "processId": "uuid",
      "sessionId": "uuid",
      "warnings": [],
      "error": null
    },
    {
      "rowNumber": 53,
      "outcome": "FAILED",
      "candidateId": null,
      "processId": null,
      "sessionId": null,
      "warnings": [],
      "error": "Unrecognized duration format: Powerday"
    }
  ]
}
```

`outcome` values: `IMPORTED`, `UPDATED`, `FAILED`. A failed row does not fail the batch or roll back rows already processed — check `results` for per-row detail.

Returns `400` if no file is attached or the file isn't a `.csv`.

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

`page` is zero-based. Session list scoped to a process (`GET /processes/:id/sessions`) returns a plain array, not a paginated envelope; the top-level `GET /sessions` endpoint uses the paginated envelope like other list endpoints.

---

## Rate limiting

| Scope               | Limit                          |
|---------------------|--------------------------------|
| `POST /auth/login`  | 10 requests / minute per IP    |
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
