# Identity Federation — Zitadel as the Single Identity Provider

**Status:** Draft — for review
**Date:** 2026-09-23
**Applies to:** Interview Management System (IMS, this repo) · Onboarding Platform
(`Eva-Packaging/onboarding-platform`) · Kasm Workspaces

> This document is written to be self-contained so it can be copied into both repositories as
> shared context. Items marked **VERIFY** are assumptions that must be confirmed against the
> deployed Zitadel/Kasm versions and the current MCP authorization spec before implementation.

---

## 1. Summary

Three systems currently manage overlapping sets of people:

| System | User store | How users authenticate today |
|---|---|---|
| **IMS** | `users` table (Spring Boot API) | Email + password → IMS-issued JWT (`jwt-auth` library); `X-API-Key` / bearer API keys for AI agents (`ROLE_AI_AGENT`) |
| **Onboarding Platform** | `user-service` → `user_profile`, `external_identity`, `user_role_assignment` | GitHub OAuth token exchanged at `POST /api/v1/auth/token` for an HS256 JWT (shared `JWT_SECRET`) |
| **Kasm Workspaces** | `kasm_db` | OIDC → **Zitadel** (GitHub as the only IdP) → Kasm JIT-creates the user on callback |

**Decision proposed:** make **Zitadel** the single identity provider and authorization server
for all three systems (and for MCP/AI-agent clients). Every other user store becomes a
**projection keyed by the Zitadel user id (`sub`)**. Only Zitadel creates identities and grants
roles.

This supersedes an earlier option of turning the onboarding `user-service` into its own OAuth2
authorization server (Spring Authorization Server). Zitadel already runs and already holds the
same people for Kasm, so building a second authorization server would add a fourth user store
rather than removing one.

## 2. Goals and non-goals

### Goals

- One identity per person across IMS, Onboarding, and Kasm; manage users in one place.
- Multiple login methods:
  - **Staff** (marketers, supporters, admins): SSO with the company identity provider, keyed on
    company email domain.
  - **Candidates / students**: GitHub (existing), optionally Google / LinkedIn or other OAuth2
    providers.
- Multiple roles per user, per application; fine-grained authorities inside each app.
- Standards-based service-to-service authentication; no shared HMAC secrets.
- OAuth2 for the IMS MCP server so AI agents that require OAuth can connect.
- Lifecycle continuity: a **student** in Onboarding eventually becomes a **candidate** in IMS
  as the *same identity* with an additional role grant — never a second account.
- Deprovisioning propagates to every downstream system (IMS, Kasm, GitHub team, Atlassian group).

### Non-goals (for this phase)

- Replacing Kasm's own session management.
- Moving onboarding orchestration (steps, retries, provisioning state) into Zitadel.
- Fine-grained permission storage in Zitadel (roles stay coarse; see §5.3).

## 3. Current state — relevant facts

### 3.1 IMS (this repo)

- Roles: `CANDIDATE`, `MARKETER`, `SUPPORTER`, `ADMIN` (`user/entity/UserRole.java`), single
  role per user. Authorization via `@PreAuthorize("hasRole(...)")` across services.
- `/auth/*` returns the role lowercased; `/users` returns the enum uppercased.
- AI agents: API keys (`apikey/ApiKeyAuthFilter.java`) grant a single authority `ROLE_AI_AGENT`,
  deliberately unscoped to the issuing supporter (see comments in
  `question/SessionQuestionService.java`).
- MCP server: Spring AI `spring-ai-starter-mcp-server-webmvc`, SSE at `/mcp/sse`.
- Spreadsheet import (`scheduleimport/ScheduleImportService.java`) creates candidates it cannot
  match by name with a **placeholder email** `<slug>.candidate@system.local`, a random password
  and `active=false`. These users have never been able to log in.
- Name matching in the import falls back to **first-token** matching (`matchByName`), which can
  merge distinct people ("John" matches "John Smith"). Name alone is not an identity.
- Candidate scoping is decided by role presence, e.g.
  `InterviewSessionService.java:280` and `InterviewProcessService.java:213` test
  `anyMatch(ROLE_CANDIDATE)`. **This breaks under multi-role** (see §8.3).

### 3.2 Onboarding Platform

- Services: `api-gateway`, `user-service`, `onboarding-service`, `provisioning-service`
  (GitHub + Atlassian adapters), shared `common`. Kafka + transactional outbox.
- `user-service` schema: `user_profile` (display_name, primary_email, status
  `PENDING_ONBOARDING | ACTIVE | ACTION_REQUIRED | SUSPENDED`), `external_identity` (GitHub,
  Atlassian), `app_role` (`STUDENT`, `INSTRUCTOR`, `ADMIN`), `user_role_assignment`
  (already many-to-many), `identity_link` (GitHub ↔ Atlassian correlation).
- Auth: `TokenExchangeService` verifies a GitHub token and issues an HS256 JWT via
  `PayloadTokenProvider` with claims `sub` (user_profile id), `correlationId`, `isAdmin`. No
  email, roles, status, or refresh token.
- Service-to-service: `ServiceTokenProvider` — same shared secret, 5-minute tokens.
- Internal API: lookup external identity by provider + email; create identity link. No
  list/search/get-by-id user endpoint.
- Event: `edu.user.registered.v1` (`UserRegisteredV1.avsc`). No status-changed / deprovision
  event.

**Security defect (fix regardless of this spec):** `/api/v1/users/registrations` is a public
gateway path and `UserRegistrationService` assigns `roleKeys` taken from the request body.
Anyone can self-register with `roleKeys: ["ADMIN"]` and receive `isAdmin: true`.

### 3.3 Kasm Workspaces

- Kasm is an OIDC client of Zitadel. Zitadel currently federates only GitHub.
- On callback Kasm JIT-creates a user in `kasm_db`. JIT does **not** deprovision.

## 4. Target architecture

```
                               ┌────────────────────────── Zitadel ──────────────────────────┐
 Company IdP (Google/Entra) ─▶ │  Orgs: Staff (company domain, SSO) · Candidates (GitHub, …)   │
 GitHub / Google / LinkedIn ─▶ │  Projects + roles: IMS · Onboarding · Kasm                    │
                               │  OIDC/OAuth2 AS · JWKS · service users · Actions/webhooks     │
                               └──────┬──────────────────┬───────────────────┬────────────────┘
                                      │ OIDC             │ OIDC               │ user/grant events
                                      ▼                  ▼                    ▼
                               ┌────────────┐     ┌──────────────┐    ┌────────────────────┐
                               │   Kasm     │     │ IMS web+API  │    │ onboarding         │
                               │ (kasm_db)  │     │ + MCP server │    │ user-service       │
                               └─────▲──────┘     └──────▲───────┘    └─────────┬──────────┘
                                     │ deprovision        │ provision/link       │ Kafka
                                     │                    │                      ▼
                               ┌─────┴────────────────────┴──────────────────────────────────┐
                               │ provisioning-service adapters:                               │
                               │   GitHub team · Atlassian group · Kasm (new) · IMS (new)     │
                               └──────────────────────────────────────────────────────────────┘
```

### 4.1 Ownership

| Layer | Owns | Keyed by |
|---|---|---|
| **Zitadel** | Authentication, linked IdPs, sessions, **role grants**, tokens, service users | `sub` |
| **onboarding `user-service`** | Domain profile, onboarding state, GitHub ↔ Atlassian correlation | `sub` (replaces GitHub-id keying) |
| **IMS `users`** | Read projection for joins (e.g. `candidateName` joined server-side), domain FKs | `sub` (new `external_id` column) |
| **`kasm_db`** | Kasm's JIT user | Stable claim — see §9 |

**Invariant:** only Zitadel creates identities or changes role grants. Downstream stores are
created by JIT login or by provisioning adapters and are never the source of truth for
authentication or authorization.

## 5. Identity and role model

### 5.1 Organizations

| Org | Members | Login policy |
|---|---|---|
| **Staff** | Marketers, supporters, admins | Company IdP only (Google Workspace or Microsoft Entra); company domain verified; **domain discovery** routes `@company.com` to SSO |
| **Candidates** | Students / candidates | GitHub (existing); optionally Google, LinkedIn |

JIT creation from company SSO creates the identity but **grants no roles**. A company email
must never confer `ADMIN` implicitly.

### 5.2 Projects and roles

| Project | Roles |
|---|---|
| `IMS` | `CANDIDATE`, `MARKETER`, `SUPPORTER`, `ADMIN`, `PROVISIONER` (service users only) |
| `Onboarding` | `STUDENT`, `INSTRUCTOR`, `ADMIN`, `READER` (service users only) |
| `Kasm` | `WORKSPACE_USER` (extend as needed) |

- A user grant can hold several roles per project → multi-role support.
- Enable **"assert roles on authentication"** per project so tokens carry
  `urn:zitadel:iam:org:project:roles` (and the project-scoped variant).
- **Student → candidate** is a grant of `IMS:CANDIDATE` to the existing identity.

### 5.3 Authorities (fine-grained)

Zitadel roles are flat. Keep them coarse in Zitadel and map **role → authorities in each
application**, e.g. in IMS:

| Role | Authorities (examples) |
|---|---|
| `ADMIN` | `users:manage`, `questions:write`, `questions:delete`, `processes:write`, … |
| `MARKETER` | `processes:write`, `clients:write`, `sessions:write` |
| `SUPPORTER` | `sessions:read:assigned`, `questions:link:assigned`, `feedback:write:assigned` |
| `CANDIDATE` | `processes:read:own`, `sessions:read:own` |

OAuth **scopes** requested by agents (§10) further narrow the effective authorities of a token.

## 6. Authentication patterns

### 6.1 Token format and validation

- **Default:** JWT access tokens, short TTL (5–15 min), validated locally against Zitadel's JWKS.
  No per-request call to Zitadel.
- **Optional for sensitive/admin endpoints:** opaque tokens + introspection (instant revocation,
  per-request latency; cache results for a few seconds).
- Refresh tokens handled by the OIDC client (next-auth in IMS; Kasm's own client).

### 6.2 IMS → Onboarding (the primary cross-system call path)

Three distinct cases:

| Case | Mechanism | Notes |
|---|---|---|
| **On behalf of a signed-in user** (e.g. IMS shows a candidate's onboarding status) | **Token relay** — forward the user's access token. The IMS client requests the Onboarding project audience scope `urn:zitadel:iam:org:project:id:{onboardingProjectId}:aud` so the token is valid for both. | Alternative: **token exchange (RFC 8693)** to down-scope. **VERIFY** availability in the deployed Zitadel version (feature-flagged in some releases). |
| **Service-to-service** (background jobs, import lookup, provisioning callbacks) | **Zitadel service user per calling service**, `client_credentials` or private-key JWT (JWT profile). Narrow grants (`Onboarding:READER`, `IMS:PROVISIONER`). Cache the token until shortly before expiry. | Replaces `ServiceTokenProvider` (shared HS256). On Cloud Run, Google-signed ID tokens are an alternative, but one model everywhere is preferred. |
| **State propagation** (registered, role granted/revoked, suspended) | **Events** (Kafka), not synchronous calls. | Authorized by Kafka ACLs. Prefer events over sync calls wherever latency allows. |

### 6.3 Onboarding gateway and services

- Replace the HS256 `JwtAuthenticationFilter` in `api-gateway` with Spring Security OAuth2
  Resource Server (`issuer-uri` = Zitadel).
- Remove `POST /api/v1/auth/token` (GitHub token exchange) and the public
  `POST /api/v1/users/registrations`. This also removes the `roleKeys` privilege-escalation path.
- Internal endpoints stay off the gateway **and** still require a service-user token (zero trust).

### 6.4 IMS

- **Web:** next-auth uses the Zitadel provider (OIDC, PKCE).
- **API:** `spring-boot-starter-oauth2-resource-server`; a `JwtAuthenticationConverter` maps the
  IMS project roles claim → `ROLE_*` authorities (+ derived authorities from §5.3). Existing
  `@PreAuthorize("hasRole(...)")` rules continue to work if role names match.
- **Transition:** accept both legacy IMS JWTs and Zitadel tokens (two `JwtDecoder`s selected by
  issuer) until cutover.

## 7. Registration / onboarding flow (target)

1. Candidate signs in with GitHub via Zitadel (Candidates org); Zitadel creates the user on first
   login (IdP "auto-creation" enabled).
2. A **Zitadel Action / webhook** on user creation notifies `user-service` (or `user-service`
   consumes Zitadel events). **VERIFY** Actions v2 / webhook support in the deployed version.
3. `user-service` creates `user_profile` keyed by `sub`, reads the linked GitHub IdP identity
   (id + login) from the Zitadel user API into `external_identity`, and publishes
   `edu.user.registered.v1` (add `sub` to the schema; `userId` becomes `sub`).
4. `onboarding-service` orchestrates; `provisioning-service` runs adapters: GitHub team,
   Atlassian group, **Kasm**, **IMS**.
5. Role grants are made in Zitadel by an admin or a server-side rule — never from client input.

## 8. IMS changes

### 8.1 Data

- `users.external_id varchar unique null` — Zitadel `sub`.
- `users.identity_status` — `UNVERIFIED | LINKED | CONFLICT`.
- `users.linked_at timestamptz null`.
- Drop `password_hash` and IMS login endpoints at cutover; `users` becomes a projection updated
  from events / provisioning.

### 8.2 Admin Users page

The `/admin/users` page currently creates/edits users via IMS `/users`. After cutover it must
read/write through the Zitadel management API (via an IMS backend proxy using a service user),
or be replaced by Zitadel's console for identity edits, keeping IMS-only fields local. Add an
**Identity** column (`UNVERIFIED | LINKED`) and a **Link / Send invite** action during migration.

### 8.3 Multi-role correctness

Code that infers *scope* from *role presence* must change before multi-role grants go live:

- `InterviewSessionService.java:280`, `InterviewProcessService.java:213` —
  `anyMatch(ROLE_CANDIDATE)` → restrict to own records. A user holding `CANDIDATE` + `SUPPORTER`
  would be wrongly restricted when acting as a supporter.
- Replace with resource-based checks (`isCandidateOwner(id, sub)` / `isAssignedSupporter(...)`)
  combined with `hasRole` for the broader roles.

### 8.4 Spreadsheet import

- Resolve candidates against the identity projection (by `external_id` / verified email) first.
- Create a placeholder only when no match; mark `identity_status = UNVERIFIED`.
- Remove first-token name matching or flag such matches for review.

### 8.5 Linking existing placeholder candidates

Zitadel human users require an email, so do not pre-create Zitadel users for `@system.local`
placeholders.

| Method | Strength | Flow |
|---|---|---|
| **Invite / claim link** (preferred) | Strong | Admin generates a one-time claim token for an unlinked IMS candidate → candidate opens link, signs in via Zitadel → IMS binds `external_id = sub`, replaces placeholder email with the verified email, sets `active`. |
| **Admin-confirmed match** | Medium | Admin sees suggested Zitadel/onboarding matches (name + email) beside unlinked candidates and confirms. Requires a search endpoint (Zitadel user search or `user-service` internal search). |
| **Exact verified-email match** | Strong, if data exists | Only once spreadsheets include real emails. Match on verified email only; GitHub emails can be private/unverified. |
| **Self-claim ("is this you?")** | Weak | Only with admin approval. |

## 9. Kasm considerations

- **Stable user key.** If Kasm keys JIT users on email, an email change (placeholder → real,
  GitHub account switch) creates duplicate Kasm users. Configure Kasm's OIDC username attribute
  to `sub` or another immutable claim. **VERIFY** which attributes Kasm supports.
- **Deprovisioning.** JIT never removes users. Add a **Kasm provisioning adapter** that disables
  or deletes users via the Kasm Developer API on role revocation / suspension events.
- **Group mapping.** Map the `Kasm` project roles claim to Kasm groups via Kasm SSO group
  mappings so workspace access follows Zitadel grants.
- **SSO continuity.** A candidate with a live Zitadel session from Kasm reaches IMS without
  re-authenticating (shared Zitadel session).

## 10. MCP / AI agents

- The IMS MCP server becomes an **OAuth 2.1 protected resource**:
  - Publish `/.well-known/oauth-protected-resource` (RFC 9728) with the Zitadel issuer as
    authorization server.
  - Return `401` with `WWW-Authenticate` (resource metadata pointer) on unauthenticated calls.
  - Validate audience (IMS project) on every request.
- Clients use authorization code + PKCE (S256); tokens represent **the user**, narrowed by
  consented scopes (`questions:read`, `questions:write`, `sessions:read`, …). The client id
  (`azp`) identifies the agent for auditing.
- **Replaces `ROLE_AI_AGENT`**, which is currently unscoped to the issuing user — scopes are a
  tighter model.
- **Open risk — client registration. VERIFY:** most MCP clients expect Dynamic Client
  Registration (RFC 7591) or Client ID Metadata Documents. Zitadel may not support open DCR
  natively. Options:
  1. A small registration facade that creates Zitadel OIDC apps via the management API
     (rate-limited, restricted redirect URIs).
  2. Pre-registered clients for the specific agents in use.
  3. Client ID Metadata Documents, if supported by both the MCP spec version and Zitadel.
- Keep API keys as a fallback until registration is solved; retire afterward or replace with
  client-credentials service users for headless agents.

## 11. Events

| Event | Producer | Consumers | Status |
|---|---|---|---|
| `edu.user.registered.v1` | user-service | onboarding-service | Exists — add `sub` |
| `identity.role.granted.v1` / `.revoked.v1` | user-service (from Zitadel webhook) | provisioning (IMS, Kasm, GitHub, Atlassian adapters) | New |
| `identity.user.status-changed.v1` (suspended/reactivated) | user-service | provisioning, IMS projection | New |
| `identity.user.profile-updated.v1` (name/email) | user-service | IMS projection, Kasm adapter | New |

Document new schemas in the Avro folder (`backend/common/src/main/avro`) and in IMS
`docs/kafka-event-schema.md`.

## 12. Security requirements

1. Fix the public registration `roleKeys` escalation immediately (independent of migration).
2. No shared HMAC signing secrets between services; asymmetric keys via JWKS only.
3. Every API validates `iss`, `aud` (project), `exp`; reject tokens for other projects.
4. Role grants only via Zitadel admin or audited server-side rules.
5. Auto-link IdP accounts only on **verified** emails.
6. Company SSO JIT creates identities without roles.
7. Service users get the minimum project roles required; one service user per calling service.
8. Deprovisioning must reach every downstream system (IMS, Kasm, GitHub, Atlassian); JIT stores
   are not trusted to self-clean.

## 13. Rollout plan

| Phase | Work | Repo(s) |
|---|---|---|
| **0 — Hardening** | Remove client-supplied `roleKeys`; stop exposing registration publicly or gate it. | Onboarding |
| **1 — Zitadel model** | Create Staff/Candidates orgs, IMS/Onboarding/Kasm projects and roles, role assertion; service users per service. | Zitadel config (IaC if possible, e.g. Terraform provider) |
| **2 — Onboarding on Zitadel** | Gateway + services as resource servers; `user_profile` keyed by `sub`; Zitadel Action/webhook → profile creation; remove `/auth/token`; replace `ServiceTokenProvider` with service users. | Onboarding |
| **3 — IMS as OIDC client + resource server** | next-auth Zitadel provider; dual token acceptance; `external_id` / `identity_status` columns; role→authority mapping; fix multi-role scoping (§8.3). | IMS |
| **4 — Migration of existing IMS users** | Staff: match by real email → link. Candidates: invite/claim flow. | IMS |
| **5 — Provisioning adapters** | IMS adapter (create/link/deactivate candidate), Kasm adapter (deprovision + group sync); new identity events. | Onboarding (+ IMS endpoints) |
| **6 — Staff SSO** | Company IdP in Staff org, domain discovery; admin grants roles. | Zitadel config |
| **7 — MCP OAuth** | Protected resource metadata, audience validation, scopes, client registration solution; deprecate API keys. | IMS (+ facade if needed) |
| **8 — Cutover** | Remove IMS password login, local user CRUD, legacy JWT acceptance; admin Users page on Zitadel API. | IMS |

## 14. Open questions

1. Zitadel hosting (self-hosted vs Zitadel Cloud) and version — determines Actions v2,
   token exchange, and DCR options.
2. Company IdP: Google Workspace or Microsoft Entra?
3. Kasm OIDC username attribute — can it be `sub`?
4. Should `user-service` keep any user-facing API, or become internal-only and event-driven?
5. Where do fine-grained authority mappings live — per-app code (proposed) or a shared library?
6. Do candidate spreadsheets have (or can they get) real email addresses?
7. Zitadel availability requirements now that it gates every login (HA, backups, upgrade policy),
   and network reachability from Cloud Run and the IMS `cloudflared` tunnel.

## 15. Risks

| Risk | Impact | Mitigation |
|---|---|---|
| Zitadel becomes a single point of failure for all logins | High | HA deployment, Postgres backups, tested upgrade path; JWT validation is local so existing sessions survive short outages |
| MCP client registration unsupported by Zitadel | Blocks agent OAuth | Registration facade or pre-registered clients (§10) |
| Duplicate identities from email-keyed JIT stores | Medium | Key all projections on `sub`; verified-email-only linking |
| Multi-role breaks role-inferred scoping in IMS | Data exposure / wrong filtering | §8.3 fixes land before multi-role grants |
| Wrong placeholder-to-person links | Data attached to wrong candidate | Claim-link flow; no name-only auto-linking |
| Zitadel feature/API differences across versions | Rework | Resolve **VERIFY** items before phase 2 |
