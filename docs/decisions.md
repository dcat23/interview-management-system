# ADR 001 — Modular monolith over microservices

**Status:** Accepted  
**Date:** 2024-01

## Context

The platform has four user roles, six core entities, and tight relationships between them (sessions belong to processes, feedback belongs to sessions, questions are linked to sessions). A microservices architecture would require distributed transactions or eventual consistency to maintain referential integrity across these relationships.

The initial user base is small (< 500 concurrent users). Team size is 2–3 engineers.

## Decision

Build a **modular monolith** using Spring Boot 3 with clear internal module boundaries (`auth`, `user`, `client`, `process`, `session`, `question`, `feedback`, `job`). Each module has its own service layer, repository layer, and DTOs. Cross-module calls go through service interfaces, not direct repository access.

## Consequences

**Positive:**
- Single deployment unit — simpler CI/CD, no inter-service networking to manage
- Referential integrity enforced at the database level without distributed transactions
- Easier to refactor — module boundaries can evolve without API versioning between services
- Lower operational overhead at this team size

**Negative:**
- All modules scale together — cannot scale question bank independently of session management
- A severe bug can affect all modules (mitigated by robust testing and observability)

## Future path

If scale demands it (> 10,000 concurrent users, > 10 engineers), the module boundaries defined now map directly to candidate microservices. The `question` module is the most likely first extraction candidate due to independent scaling needs.

---

# ADR 002 — Kafka for status transition pipeline

**Status:** Accepted  
**Date:** 2024-01

## Context

Sessions need to auto-transition from `scheduled` to `in_review` when `scheduled_at` passes and no outcome has been set. Notifications need to be sent to relevant users on every status transition. These are async concerns that should not block the API response.

## Decision

Use **Apache Kafka (AWS MSK)** for two purposes:

1. `session.status.changed` — decouples status transition events from downstream consumers (notification sender, future audit systems)
2. `notifications.send` — decouples notification delivery from the API and background job

The background job publishes to `session.status.changed` when it auto-transitions sessions. The API publishes to the same topic on manual transitions.

## Alternatives considered

**SQS + SNS:** Simpler operationally. Rejected because Kafka provides ordered delivery per partition (critical for status history accuracy) and easier replay of historical events for debugging.

**Polling (no Kafka):** Background job could query RDS directly and send SES emails inline. Simpler, but tightly couples the job to notification logic and makes it harder to add future consumers.

**Spring Events (in-process):** Simplest option. Rejected because it doesn't survive application restart and doesn't provide an audit trail of emitted events.

## Consequences

**Positive:**
- Ordered delivery per `process_id` partition ensures status history is written in correct order
- Event replay available for debugging and backfill
- New consumers (future webhooks, reporting) can subscribe without modifying producers

**Negative:**
- MSK adds infrastructure cost and complexity
- Requires idempotency implementation in all consumers
- Developer experience: local dev requires a running Kafka instance (mitigated via Docker Compose)

---

# ADR 003 — PostgreSQL full-text search over Elasticsearch

**Status:** Accepted  
**Date:** 2024-01

## Context

Admins and supporters need to search the question bank by keyword across topic and body fields. The initial question bank is expected to contain hundreds to low thousands of questions.

## Decision

Use **PostgreSQL `tsvector` with GIN index** for full-text search on the `questions` table. Topic is weighted `A` (higher relevance), body is weighted `B`. A trigger maintains the `search_vector` column automatically.

## Alternatives considered

**Elasticsearch / OpenSearch:** Powerful relevance tuning and faceted search. Rejected because it adds significant operational complexity (separate cluster, index sync) and the search requirements (by topic, round, client + keyword) are fully met by PostgreSQL at this scale.

**ILIKE queries:** Simple to implement but uses sequential scans and has no relevance ranking. Rejected as the question bank grows.

## Consequences

**Positive:**
- No additional infrastructure — search runs in the existing RDS instance
- Automatic index maintenance via trigger
- English-language stemming and stop words handled by PostgreSQL's `english` dictionary

**Negative:**
- Not suitable if question bank grows to millions of records (move to OpenSearch at that point)
- No fuzzy matching (typo tolerance) — acceptable for a professional question bank where queries are structured

---

# ADR 004 — AWS native observability over third-party tools

**Status:** Accepted  
**Date:** 2024-01

## Context

The platform requires logging, metrics, distributed tracing, and frontend monitoring. Options include third-party SaaS tools (Datadog, New Relic, Sentry, Grafana Cloud) or AWS native services.

## Decision

Use **AWS native observability exclusively:**

- **Logs:** CloudWatch Logs (via ECS `awslogs` log driver)
- **Metrics:** CloudWatch Metrics via Micrometer + `micrometer-registry-cloudwatch2`
- **Traces:** AWS X-Ray
- **Frontend:** CloudWatch RUM
- **Alarms:** CloudWatch Alarms → SNS

## Alternatives considered

**Datadog:** Excellent product with strong APM and log correlation. Rejected due to cost at scale and adding a third-party dependency when AWS native tools meet all requirements.

**Grafana + Prometheus:** Strong open-source option. Rejected because it requires running and maintaining Prometheus infrastructure on ECS. CloudWatch EMF achieves the same metric pipeline without additional services.

**Sentry (frontend):** Good error tracking with source maps. Rejected in favour of CloudWatch RUM to keep the full stack within AWS. CloudWatch RUM covers JS errors, performance, and Core Web Vitals from one console.

## Consequences

**Positive:**
- Single console for all observability data
- No additional per-seat or per-GB costs beyond CloudWatch usage
- IAM-based access control — no additional credentials to manage
- Tight integration with ECS, RDS, MSK, ALB (metrics auto-published)

**Negative:**
- CloudWatch Log Insights queries are less ergonomic than Datadog's query language
- X-Ray UI is less polished than Datadog APM for complex trace analysis
- CloudWatch RUM lacks Sentry's error grouping and source map support

These trade-offs are acceptable for the platform's current scale and team size. The observability stack can be supplemented with Datadog or Grafana later if the team's needs outgrow CloudWatch.
