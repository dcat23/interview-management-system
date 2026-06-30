# Roadmap

Total estimated duration: **28 weeks** to production with pilot.

Assumes a small team (2 backend engineers, 1–2 frontend engineers, 1 DevOps). Solo developer: double the timeline, run phases 3 and 4 sequentially.

---

## Phase 1 — Discovery and design (weeks 1–2)

### Objectives
- Finalise all data model decisions
- Sign off API contract with stakeholders
- Agree role permission matrix
- Define environment strategy (dev / staging / prod)
- Set up GitHub org, monorepo structure, and branch strategy

### Deliverables
- Finalised `docs/` (this spec set)
- OpenAPI 3.0 spec (`docs/openapi.yaml`) generated from this API reference
- Figma wireframes per role (candidate schedule, marketer session creation, supporter feedback form, admin query interface)
- GitHub monorepo scaffold with empty `apps/`, `services/`, `infrastructure/` directories
- ADRs written (see `docs/adr/`)

### Branch strategy
- `main` — always deployable to staging
- `develop` — integration branch, deployed to dev
- `feature/{name}` — short-lived, branched from `develop`, PR back to `develop`
- Releases: tags on `main` (`v1.0.0`) trigger prod deployment

---

## Phase 2 — Infrastructure foundation (weeks 1–4, parallel with phase 1 from week 2)

### Objectives
- Provision AWS infrastructure via Terraform
- Bootstrap CI/CD pipelines

### Deliverables

**Terraform modules completed:**
- `vpc` — VPC, subnets (public/private, 3 AZs), NAT gateway, security groups
- `rds` — PostgreSQL 16, Multi-AZ, parameter group (`require_ssl=1`), automated backups
- `elasticache` — Redis 7, subnet group, security group
- `msk` — Kafka 3.5, 3 brokers, TLS encryption, 2 topics provisioned (`session.status.changed`, `notifications.send`)
- `ecs` — ECS cluster, ECR repositories (api, web, background-job), task execution role with Secrets Manager access
- `alb` — HTTPS listener, ACM certificate, target groups for api and web
- `observability` — CloudWatch log groups, dashboards, alarms, SNS topic, RUM app

**GitHub Actions workflows bootstrapped:**
- `api-ci.yml` — build + test on push to `develop` / PR to `main`
- `web-ci.yml` — build + test
- `job-ci.yml` — build + test
- `deploy.yml` — deploy all services on push to `main` (staging) or release (prod)

**Milestone:** Dev environment live. Healthcheck endpoint returning 200.

### Risks
- MSK provisioning time (15–20 min per apply) — plan Terraform applies early
- IAM permission errors are common on first pipeline run — budget a day for IAM debugging

---

## Phase 3 — Core backend development (weeks 3–8)

### Weeks 3–4: Auth and user foundation

- Spring Boot 3 project setup (`apps/api`)
  - Module structure: `auth`, `user`, `client`, `process`, `session`, `question`, `feedback`, `job`
  - Spring Security JWT filter chain
  - `@PreAuthorize` RBAC annotations on all service methods
  - BCrypt password hashing
  - Refresh token rotation with Redis blocklist
- Flyway migrations: all tables (`V1` through `V10`)
- User CRUD (`POST /users`, `GET /users`, `PATCH /users/:id`)
- End client CRUD
- Healthcheck and Spring Actuator endpoints

### Weeks 5–6: Process, sessions, and status transitions

- `InterviewProcess` service and API endpoints
- `InterviewSession` service and API endpoints (nested under process)
- Status transition engine (`SessionStatusTransitionService`)
  - All valid transitions defined as an enum state machine
  - Role enforcement per transition
  - `STATUS_HISTORY` writer
  - Returns `409` on invalid transitions
- Kafka producer: `session.status.changed` on every status change
- Question bank CRUD with versioning
- `SESSION_QUESTION` linking endpoints
- Redis caching layer (session list, question sets)

### Weeks 7–8: Feedback, background job, and search

- Feedback service (draft → submit, lock on submission)
- `GET /processes/:id/timeline` rollup endpoint
- `GET /processes/:id/feedback` cross-round rollup
- Background job service (`services/background-job`)
  - Spring `@Scheduled` hourly trigger
  - Queries `scheduled` sessions where `scheduled_at < now()`
  - Acquires PostgreSQL advisory lock before running (prevents concurrent execution)
  - Transitions each to `in_review`, writes `STATUS_HISTORY` with `change_source = background_job`
  - Publishes to `session.status.changed` Kafka topic
  - Publishes to `notifications.send` Kafka topic for each affected session
  - Custom Micrometer metrics: `background.job.executions`, `background.job.sessions.transitioned`, `background.job.duration`
- Kafka consumer: `notifications.send` → AWS SES email dispatch
- Full-text search on questions (`tsvector` + GIN index + `to_tsquery`)
- OpenAPI docs auto-generated via `springdoc-openapi`

**Milestone:** All API endpoints implemented. Integration tests passing against Testcontainers.

### Technical requirements
- Java 21 (virtual threads enabled: `spring.threads.virtual.enabled=true`)
- Testcontainers for integration tests (Postgres + Redis + Kafka spun up per test suite)
- `spring-boot-starter-validation` for Bean Validation on all DTOs
- `micrometer-registry-cloudwatch2` configured from day one

---

## Phase 4 — Frontend development (weeks 5–10, overlaps phase 3)

Weeks 1–2 of frontend can start in parallel with Phase 3 weeks 3–4. Full API required from Phase 4 week 3 onwards.

### Weeks 5–6: Scaffold and auth (parallel with phase 3 weeks 3–4)

- Next.js 14 App Router project setup (`apps/web`)
- Role-aware layout: separate root layouts per role (`/candidate`, `/marketer`, `/supporter`, `/admin`)
- Route guards: middleware checks JWT role claim, redirects on mismatch
- Login page + JWT handling
  - `access_token` in memory (React context)
  - `refresh_token` in `HttpOnly` cookie via Next.js API route proxy
  - Silent refresh on 401
- API client layer: React Query + Axios with base URL from env
- Shared component library: shadcn/ui + Tailwind CSS
- Zod schemas matching API request/response shapes

### Weeks 7–8: Role views

**Candidate views:**
- `/candidate/processes` — list of processes with session count and technology
- `/candidate/processes/:id` — process detail with session timeline
- `/candidate/sessions/:id` — session detail with prep questions (ordered by `display_order`)

**Marketer views:**
- `/marketer/processes` — list with filters (client, status, technology)
- `/marketer/processes/new` — create process form
- `/marketer/processes/:id` — process detail with all sessions
- `/marketer/sessions/new` — schedule session form (within a process)
- `/marketer/sessions/:id/status` — status transition controls

**Supporter views:**
- `/supporter/sessions` — assigned sessions list
- `/supporter/sessions/:id` — session detail with question linking UI
- `/supporter/sessions/:id/feedback` — feedback draft editor + submit

**Admin views:**
- `/admin/processes` — all processes with advanced filters
- `/admin/questions` — question bank with client + topic + round + search filters
- `/admin/questions/new` — create question form

### Weeks 9–10: Admin tooling and polish

- `/admin/processes/:id/timeline` — visual timeline of all rounds, statuses, feedback indicators
- `/admin/processes/:id/feedback` — all feedback across rounds in one view
- `/admin/sessions/:id/status-history` — status audit trail
- Question bank: bulk display order editing for session questions
- Status transition modals: confirmation dialogs with current → next state display
- Error states, empty states, loading skeletons for all views
- Responsive design pass (mobile-usable for supporter feedback submission)

**Milestone:** All four role experiences complete. E2E smoke test suite passing.

---

## Phase 5 — Integrations and observability (weeks 9–12)

### Objectives
- Email notification delivery
- Full observability stack live in staging

### Deliverables

**Notifications:**
- AWS SES domain verification and email templates for:
  - `SESSION_SCHEDULED` — to candidate and supporter
  - `SESSION_IN_REVIEW` — to admin and marketer
  - `SESSION_OUTCOME` — to admin and marketer
  - `FEEDBACK_SUBMITTED` — to admin
- Kafka consumer group `background-job.notification-sender` consuming `notifications.send`
- Dead letter topics (`*.dlq`) with CloudWatch alarm on lag

**Observability:**
- CloudWatch Logs: all log groups live, Log Insights saved queries documented
- CloudWatch Metrics: Micrometer publishing verified, custom metrics instrumented
- X-Ray: trace sampling rules configured, service map verified end-to-end
- CloudWatch Dashboards: all four dashboards (API health, session ops, data layer, frontend)
- CloudWatch Alarms: all 11 alarms configured and tested
- CloudWatch RUM: script added to Next.js root layout, frontend dashboard live

### Risks
- SES domain verification requires DNS changes — initiate in week 9, verification may take 24–72 hours
- First Kafka consumer lag alarm may fire during initial consumer group setup — expected, not a real incident

---

## Phase 6 — QA and hardening (weeks 13–16)

### Testing layers

| Layer | Tool | Coverage target |
|---|---|---|
| Unit | JUnit 5 + Mockito | Status transition engine, role guards, service logic |
| Integration | Spring Boot Test + Testcontainers | All API endpoints per role |
| Contract | Spring Cloud Contract | API spec vs implementation |
| E2E | Playwright | Happy path per role + key error states |
| Load | k6 | 500 concurrent users on session list and question bank queries |
| Security | OWASP ZAP | Staging environment scan |

### Hardening checklist

- [ ] Rate limiting verified on auth endpoints
- [ ] CORS policy locked to frontend domain only per environment
- [ ] All response payloads audited for data leakage across roles
- [ ] Security headers verified on all responses
- [ ] RDS automated backup restore tested (point-in-time recovery)
- [ ] ECS task failure tested (task killed, verify ECS restarts and ALB routes around)
- [ ] Background job idempotency verified under duplicate Kafka delivery
- [ ] Background job advisory lock verified (second instance cannot run concurrently)
- [ ] Kafka DLQ tested: consumer throws, verify message routes to DLQ and alarm fires
- [ ] JWT expiry and refresh flow verified end-to-end
- [ ] Dependabot enabled and first round of dependency updates applied

---

## Phase 7 — Pilot (weeks 17–19)

### Scope
Deploy to production-equivalent environment. Run 5–10 real interview sessions through the complete lifecycle with internal users.

### Participants
- 1–2 marketers creating real processes and sessions
- 2–3 interview supporters submitting questions and feedback
- Admin reviewing feedback and querying question bank

### Success criteria
- Zero data loss events
- Status transitions correct in all observed cases
- No role leakage observed
- Background job triggers reliably within 1 hour of `scheduled_at`
- Feedback visible to admin within 60 seconds of submission
- All users able to complete core flows without hand-holding

### Feedback handling
- Issue tracker: GitHub Issues, labelled `pilot-feedback`
- Critical bugs fixed before production launch
- UX improvements: assessed for pre-launch vs post-launch
- Feature requests: added to post-launch backlog

---

## Phase 8 — Production launch (weeks 20–21)

### Go/no-go criteria
- All Phase 6 test suites passing on `main`
- Pilot feedback critical items resolved
- Runbooks written for top 5 failure scenarios
- On-call rotation established (minimum 2 people)
- CloudWatch alarms confirmed firing correctly in staging
- RDS snapshot taken immediately before DNS cutover

### Launch sequence
1. Pre-deployment RDS snapshot
2. Run Flyway migrations via ECS task
3. Deploy all three ECS services (`api`, `web`, `background-job`) via blue/green
4. Wait for ECS `services-stable`
5. Run smoke test suite against production endpoint
6. Cut DNS (Route 53) from old environment (if migrating) or point users to new URL
7. Monitor CloudWatch dashboards for 30 minutes
8. Declare launch complete

### Rollback trigger
Any of:
- Smoke test failure
- `5xx` rate > 5% in first 10 minutes
- Background job not executing
- Data integrity issue found

Rollback: revert ECS task definition to previous revision. Takes < 3 minutes.

---

## Phase 9 — Post-launch (week 22 onwards)

### Stabilisation (weeks 22–25)
- Daily CloudWatch dashboard review
- Bug triage: critical 4hr SLA, high 24hr, medium 1 week
- Weekly retro with active users
- Performance tuning based on real query patterns (slow query log from RDS)
- Redis TTL tuning based on cache hit rate metrics

### Backlog (prioritised post-launch)
1. Email notifications to candidates on session schedule changes
2. Admin reporting dashboard: placement rates by client, pass rates by round, round-to-round conversion
3. Bulk question import via CSV upload
4. Calendar integration (Google Calendar / Outlook) for session scheduling
5. Candidate self-service: reschedule request workflow
6. Multi-language question bank
7. Question tagging system (difficulty level, category)
8. Process analytics: average rounds to placement, time-to-placement by technology
