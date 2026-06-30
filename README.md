# interview management system
## Overview

Interview platform for a job training and placement company. Manages the full lifecycle of candidate interview processes — from session scheduling through multi-round progression, question bank management, supporter feedback, and admin reporting.

## Users and roles

| Role | Responsibilities |
|---|---|
| **Candidate** | Views upcoming interview sessions and prep questions scoped to their process |
| **Marketer** | Creates and manages interview processes and sessions, owns pre-interview status transitions |
| **Interview supporter** | Conducts interviews, links questions asked, submits post-interview feedback, sets post-interview outcomes |
| **Admin** | Full read/write access across all entities, queries question bank, reviews all feedback and timelines |

## Architecture decision

**Chosen pattern: Modular monolith (Spring Boot 3)**

A microservices architecture is not justified at this scale. Domain boundaries (sessions, questions, feedback) are tightly coupled — splitting them adds deployment overhead and distributed transaction complexity with no meaningful benefit. A well-structured modular monolith with clear package boundaries delivers the same separation of concerns and can be decomposed later if scale demands it.

Kafka is introduced specifically for the status transition pipeline (`scheduled → in_review` auto-transition) and notification events. It is not used as a general-purpose communication bus between internal modules.

## High-level architecture

```
┌─────────────────────────────────────────────────────────────┐
│                         Clients                             │
│   Candidate │ Marketer │ Interview Supporter │ Admin        │
└──────────────────────┬──────────────────────────────────────┘
                       │ HTTPS
┌──────────────────────▼──────────────────────────────────────┐
│                    AWS ALB (HTTPS / SSL)                    │
└──────────────────────┬──────────────────────────────────────┘
          ┌────────────┴────────────┐
          ▼                         ▼
┌─────────────────┐      ┌──────────────────────────────────┐
│  Next.js Web    │      │     Spring Boot 3 API            │
│  (ECS Fargate)  │─────▶│     (ECS Fargate)                │
│  App Router     │ REST │                                  │
│  React Query    │      │  auth · user · client            │
│  shadcn/ui      │      │  process · session               │
└─────────────────┘      │  question · feedback             │
                         └────────┬─────────────────────────┘
                    ┌─────────────┼─────────────┐
                    ▼             ▼             ▼
            ┌──────────┐  ┌──────────┐  ┌──────────────┐
            │ RDS PG   │  │ Redis    │  │ MSK Kafka    │
            │ Multi-AZ │  │ Cache    │  │ (2 topics)   │
            └──────────┘  └──────────┘  └──────┬───────┘
                                               ▼
                                  ┌────────────────────────┐
                                  │ Background Job Service │
                                  │ (ECS Fargate)          │
                                  │ auto in_review · notif │
                                  └────────────────────────┘
```

## Module boundaries

### `auth`
JWT issuance, refresh token rotation, Spring Security filter chain. No business logic.

### `user`
User CRUD, role management. Depended on by all other modules for identity resolution.

### `client`
End client (company) management. Referenced by `process` and `question` modules.

### `process`
`InterviewProcess` aggregate — owns the candidate–client engagement lifecycle. Contains `InterviewSession` as a child aggregate. Owns status transition logic and writes to `STATUS_HISTORY`.

### `question`
Question bank CRUD, versioning, full-text search via PostgreSQL `tsvector`. `SESSION_QUESTION` join table managed here.

### `feedback`
Feedback draft/submit lifecycle. Scoped to a session, visible to supporters (own) and admins (all submitted).

### `job`
Background job that auto-transitions sessions from `scheduled` to `in_review` when `scheduled_at` has passed. Deployed as a separate ECS service. Publishes to Kafka `session.status.changed` topic.

## Technology stack

| Layer | Technology |
|---|---|
| Frontend | Next.js 14 (App Router), React Query, shadcn/ui, Tailwind CSS, Zod |
| Backend | Spring Boot 3, Spring Security, Spring Data JPA, Flyway |
| Database | PostgreSQL 16 (AWS RDS Multi-AZ) |
| Cache | Redis (AWS ElastiCache) |
| Messaging | Apache Kafka (AWS MSK) |
| Infrastructure | AWS ECS Fargate, ALB, ACM, ECR, Secrets Manager, Route 53 |
| IaC | Terraform |
| CI/CD | GitHub Actions |
| Observability | CloudWatch Logs, CloudWatch Metrics (Micrometer + EMF), AWS X-Ray, CloudWatch RUM |

## Security model

- **Authentication:** JWT (access token 1hr TTL, refresh token 7d TTL). Rotated on refresh. Invalidated on logout via Redis blocklist.
- **Authorization:** Spring `@PreAuthorize` on all service methods. Role extracted from JWT claim.
- **Transport:** HTTPS enforced at ALB. Internal ECS communication over private VPC subnets only.
- **Secrets:** All credentials in AWS Secrets Manager. Injected as ECS task environment variables at runtime. Never in code or `.env` files.
- **Input validation:** Jakarta Bean Validation on all request DTOs. JPA parameterised queries prevent SQL injection.
- **CORS:** Locked to frontend domain only per environment.

## Caching strategy

| Cached entity | TTL | Invalidation trigger |
|---|---|---|
| Session list per process | 5 min | Session create / update |
| Question set per session | 10 min | SESSION_QUESTION change |
| User role by user ID | 15 min | User role update |
| End client list | 30 min | Client create / update |

## Scalability

The initial deployment runs fixed ECS task counts suitable for a small user base. Available scaling levers without architectural change:

- **API:** ECS service auto-scaling on CPU/memory. Stateless — any number of tasks run concurrently.
- **Background job:** Single task with a database-level advisory lock to prevent concurrent execution.
- **Database:** RDS read replica addable for admin query traffic. HikariCP connection pooling configured from day one.
- **Cache:** ElastiCache cluster mode for horizontal Redis scaling.
- **Kafka:** MSK partition count increase for higher throughput.

## Monorepo structure

```
/
├── apps/
│   ├── api/                      # Spring Boot 3 API
│   └── web/                      # Next.js 14 frontend
├── services/
│   └── background-job/           # Spring Boot background job
├── infrastructure/
│   └── terraform/
│       ├── modules/
│       │   ├── vpc/
│       │   ├── ecs/
│       │   ├── rds/
│       │   ├── elasticache/
│       │   ├── msk/
│       │   ├── alb/
│       │   └── observability/
│       └── envs/
│           ├── dev/
│           ├── staging/
│           └── prod/
├── docs/
│   ├── system-design.md
│   ├── api-reference.md
│   ├── database-schema.md
│   ├── kafka-event-schema.md
│   ├── roadmap.md
│   ├── deployment.md
│   ├── observability.md
│   ├── security.md
│   └── adr/
│       ├── 001-modular-monolith.md
│       ├── 002-kafka-for-status-transitions.md
│       ├── 003-postgres-full-text-search.md
│       └── 004-aws-native-observability.md
└── .github/
    └── workflows/
        ├── api-ci.yml
        ├── web-ci.yml
        ├── job-ci.yml
        └── deploy.yml
```
