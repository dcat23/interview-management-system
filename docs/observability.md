# Observability

Prod storage is AWS native — no third-party agents or SaaS monitoring tools reach prod. That's
ADR-004 (`docs/decisions.md`), unchanged by the phase-6 observability epic. What the epic changed
is the *mechanism* reaching that storage: instrumentation is OpenTelemetry (Micrometer Tracing +
`micrometer-registry-otlp`) everywhere, with only the OTLP destination swapping per Spring
profile — an ADOT collector sidecar forwarding to CloudWatch + X-Ray in prod (see
`docs/deployment.md`), versus a docker-compose-only Prometheus/Grafana/Zipkin stack for
`docker`/`local` (see ADR-004's addendum). The docker/local stack never runs against AWS and
carries none of the ECS-maintenance cost ADR-004 rejected Prometheus/Grafana over — it's local
dev tooling, not a second production backend.

---

## Three pillars

| Pillar | Prod backend | docker/local backend | Coverage |
|---|---|---|---|
| Logs | CloudWatch Logs | console (same JSON) | API, background job, Kafka consumer — structured JSON |
| Metrics | CloudWatch (via ADOT) | Prometheus + Grafana | JVM, HTTP, Kafka, cache, custom business metrics |
| Traces | AWS X-Ray (via ADOT) | Zipkin | API → RDS, Redis, Kafka — distributed trace per request |
| Frontend | CloudWatch RUM | — | Page load, JS errors, Core Web Vitals, API call failures |

---

## Logging

### Configuration (Spring Boot)

Add `logstash-logback-encoder` to output structured JSON to stdout. ECS `awslogs` log driver ships container stdout directly to CloudWatch Logs.

**`logback-spring.xml`:**
```xml
<configuration>
  <appender name="STDOUT" class="ch.qos.logback.core.ConsoleAppender">
    <encoder class="net.logstash.logback.encoder.LogstashEncoder">
      <includeCallerData>false</includeCallerData>
      <customFields>{"service":"interview-api","env":"${SPRING_PROFILES_ACTIVE}"}</customFields>
    </encoder>
  </appender>
  <root level="INFO">
    <appender-ref ref="STDOUT"/>
  </root>
</configuration>
```

### Log groups

| Log group | Retention (dev) | Retention (staging/prod) |
|---|---|---|
| `/app/api` | 7 days | 90 days |
| `/app/background-job` | 7 days | 90 days |
| `/app/kafka-consumer` | 7 days | 90 days |

### Standard log fields

Every log line includes:

```json
{
  "@timestamp": "2024-02-15T15:00:00.000Z",
  "level": "INFO",
  "service": "interview-api",
  "env": "prod",
  "traceId": "x-ray-trace-id",
  "userId": "uuid | null",
  "userRole": "supporter | null",
  "message": "string",
  "logger": "com.interview.session.SessionService"
}
```

### Key log queries (CloudWatch Log Insights)

**Failed status transitions:**
```
fields @timestamp, userId, userRole, message
| filter message like "StatusTransitionError"
| sort @timestamp desc
| limit 50
```

**Auth failures by IP (last hour):**
```
fields @timestamp, sourceIp, message
| filter message like "AuthenticationFailure"
| stats count() by sourceIp
| sort count desc
```

**Background job execution history:**
```
fields @timestamp, message, durationMs
| filter service = "background-job" and message like "JobExecution"
| sort @timestamp desc
```

**Slow API responses (> 1s):**
```
fields @timestamp, method, path, durationMs, userId
| filter durationMs > 1000
| sort durationMs desc
| limit 20
```

---

## Metrics

### Setup (Spring Boot)

Implemented in `backend/api/pom.xml` / `application-*.yaml` (phase-6 observability epic). No
CloudWatch-specific registry (`micrometer-registry-cloudwatch2`) on the classpath — metrics push
over OTLP everywhere via `micrometer-registry-otlp`, and only the destination differs per profile:
the ADOT collector sidecar in prod (which itself exports to CloudWatch as EMF, see
`docs/deployment.md`), the `otel-collector` docker-compose service in `docker`/`local` (which
exports to Prometheus).

**`pom.xml` dependencies:**
```xml
<dependency>
  <groupId>io.micrometer</groupId>
  <artifactId>micrometer-registry-otlp</artifactId>
</dependency>
<dependency>
  <groupId>org.springframework.boot</groupId>
  <artifactId>spring-boot-starter-actuator</artifactId>
</dependency>
```

**`application-prod.yaml`:**
```yaml
management:
  endpoints:
    web:
      exposure:
        include: health,info,metrics   # no prometheus/env in prod
  otlp:
    metrics:
      export:
        url: ${OTEL_EXPORTER_OTLP_METRICS_ENDPOINT:http://localhost:4318/v1/metrics}
        step: 1m
```

### Auto-published metrics (Micrometer)

| Metric | Description |
|---|---|
| `http.server.requests` | Count, duration, status per endpoint |
| `jvm.memory.used` | Heap and non-heap usage |
| `jvm.gc.pause` | GC pause duration |
| `hikaricp.connections.active` | Active DB connections |
| `hikaricp.connections.pending` | Pending DB connections |
| `cache.gets` | Redis get count (hit / miss tagged) |
| `kafka.producer.record.send.total` | Messages sent per topic |
| `kafka.consumer.records.consumed.total` | Messages consumed per topic/group |

### Custom business metrics

Instrument these manually in service classes using `MeterRegistry`:

```java
@Service
public class SessionStatusService {

    private final MeterRegistry registry;

    public void transition(Session session, SessionStatus to) {
        // ... transition logic ...

        registry.counter("session.status.transitions",
            "from", session.getStatus().name(),
            "to", to.name(),
            "source", changeSource.name()
        ).increment();

        if (error) {
            registry.counter("session.status.transition.errors",
                "from", session.getStatus().name(),
                "to", to.name()
            ).increment();
        }
    }
}
```

| Custom metric | Tags | Description |
|---|---|---|
| `session.status.transitions` | `from`, `to`, `source` | Every status transition |
| `session.status.transition.errors` | `from`, `to` | Invalid/rejected transitions |
| `feedback.submissions` | — | Feedback submitted count |
| `background.job.executions` | `result` (success/failure) | Job run count |
| `background.job.sessions.transitioned` | — | Sessions auto-moved to in_review per run |
| `background.job.duration` | — | Job execution time in ms |
| `auth.failures` | — | Login failures |

### CloudWatch namespaces

| Namespace | Source |
|---|---|
| `InterviewPlatform/API` | Spring Boot Micrometer |
| `InterviewPlatform/BackgroundJob` | Spring Boot Micrometer (job service) |
| `AWS/ECS` | Auto-published by AWS |
| `AWS/RDS` | Auto-published by AWS |
| `AWS/ElastiCache` | Auto-published by AWS |
| `AWS/Kafka` | Auto-published by AWS MSK |

---

## Distributed tracing (X-Ray via OpenTelemetry)

**Superseded design note:** this section originally specified `aws-xray-recorder-sdk-spring`
called directly, with manual `X-Amzn-Trace-Id` Kafka header propagation code. The phase-6
observability epic replaced that with Micrometer Tracing's OTel bridge instead — same X-Ray
backend, no AWS SDK on the classpath, no manual propagation code. Kept below for anyone who
still has the old approach in mind.

### Setup (Spring Boot)

**`pom.xml`:**
```xml
<dependency>
  <groupId>io.micrometer</groupId>
  <artifactId>micrometer-tracing-bridge-otel</artifactId>
</dependency>
<dependency>
  <groupId>io.opentelemetry</groupId>
  <artifactId>opentelemetry-exporter-otlp</artifactId>
</dependency>
```

No `@EnableXRay`, no X-Ray SDK. Spring Boot's Observation API auto-instruments the same surface
X-Ray SDK did:
- Inbound HTTP requests (root span)
- JDBC calls (span per query, via HikariCP + Postgres driver observation)
- Redis calls (Lettuce is Observation-aware out of the box)
- Kafka producer/consumer (Spring Kafka's `ObservationAwareKafkaTemplate`/listener container)

Spans go out over OTLP to whichever collector the active profile points at (`application-*.yaml`
— `management.otlp.tracing.endpoint`); in prod, that's the ADOT sidecar, which exports to X-Ray
(`docs/deployment.md`).

### Trace propagation to Kafka

No manual header code, unlike the superseded X-Ray-SDK approach above. Spring Kafka's
observation instrumentation propagates the OTel trace context via standard Kafka record headers
automatically — the background job's consumer picks up the same trace the API's producer started,
maintaining one trace across the async boundary with zero code in either module.

### X-Ray service map

The service map in the AWS console will show:
```
Client → ALB → Web (Next.js) → API → PostgreSQL
                                   → Redis
                                   → Kafka → Background Job → PostgreSQL
```

### Sampling rules

| Rule | Rate | Description |
|---|---|---|
| `POST /auth/login` | 5% | High volume, low value to trace every call |
| `PATCH /sessions/:id/status` | 100% | Critical path — trace all transitions |
| `GET /processes/:id/timeline` | 50% | Admin query, moderate tracing |
| All other | 10% | Default sampling |

---

## CloudWatch dashboards

### API health dashboard

Widgets:
- Request rate (requests/min) — line chart, last 3 hours
- 5xx error rate (%) — line chart with threshold line at 1%
- P50 / P95 / P99 latency by endpoint — heat map
- Auth failure count — single value + trend
- Active ECS task count — single value
- JVM heap used vs max — gauge

### Session operations dashboard

Widgets:
- Status transitions per hour by type — stacked bar chart
- Sessions auto-transitioned to `in_review` (background job) — bar chart
- Background job execution count and duration — line chart
- Status transition errors — single value (should be 0)
- Feedback submissions per hour — bar chart

### Data layer dashboard

Widgets:
- RDS CPU % — line chart
- RDS active connections vs max — line chart with threshold
- RDS read/write IOPS — line chart
- Redis cache hit rate (%) — line chart (target > 80%)
- Redis evictions — bar chart
- Kafka consumer lag per topic — line chart

### Frontend dashboard (CloudWatch RUM)

Configured via the CloudWatch RUM console. Script added to `apps/web/src/app/layout.tsx`:

```tsx
// Add to root layout <head>
<Script
  strategy="afterInteractive"
  dangerouslySetInnerHTML={{
    __html: `
      (function(n,i,v,r,s,c,x,z){...})('interview-platform-rum','us-east-1','${process.env.RUM_APP_ID}');
    `
  }}
/>
```

Widgets:
- Page load time by route — P50/P95
- JS error count by page
- Core Web Vitals: LCP, CLS, FID
- API call failures from browser
- Session count by user role (via custom metadata)

---

## Alarms

All alarms route to an SNS topic → email distribution list. Add PagerDuty or Slack via additional SNS subscriptions without changing alarm configuration.

| Alarm | Metric | Threshold | Severity | Action |
|---|---|---|---|---|
| API error rate | `5xxRate` | > 1% / 5 min | Critical | Page on-call |
| API P95 latency | `http.server.requests P95` | > 2000ms / 5 min | High | Email team |
| Background job failed | `background.job.executions{result=failure}` | > 0 | Critical | Page on-call |
| Background job missed | `background.job.executions` | < 1 per hour | Critical | Page on-call |
| Status transition errors | `session.status.transition.errors` | > 0 / 5 min | High | Email team |
| Auth failure spike | `auth.failures` | > 50 / min | High | Email team |
| Kafka consumer lag | `EstimatedMaxTimeLag` | > 60s | High | Email team |
| RDS CPU high | `CPUUtilization` | > 80% / 10 min | High | Email team |
| RDS connections near limit | `DatabaseConnections` | > 80% of max | High | Email team |
| Redis evictions | `Evictions` | > 100 / 5 min | Info | Email team |
| ECS task exit | `service TaskCount` drop | Any | Critical | Page on-call |

---

## Incident response

### Runbook: background job not transitioning sessions

1. Check CloudWatch alarm: `BackgroundJobMissed`
2. Check ECS task status: `aws ecs describe-tasks --cluster interview-prod --tasks $(aws ecs list-tasks --cluster interview-prod --service-name interview-background-job --query taskArns[0] --output text)`
3. Check CloudWatch Logs: `/app/background-job` — filter last 2 hours for `JobExecution` and `ERROR`
4. If task exited: check exit code in ECS task detail. Common causes: OOM (increase memory), startup failure (check Secrets Manager access).
5. If task running but not executing: check `@Scheduled` cron expression in application config.
6. Manual trigger: if sessions need immediate transition, run the transition query directly on RDS via bastion host (requires approval).
7. Resolve, then post incident summary to `#platform-incidents` Slack channel.

### Runbook: 5xx spike

1. Check X-Ray service map — identify which subsegment is failing (RDS, Redis, Kafka, internal).
2. If RDS: check `DatabaseConnections` metric and RDS error logs.
3. If Redis: check ElastiCache events in AWS console.
4. If internal: check CloudWatch Log Insights for stack traces in `/app/api`.
5. If deployment-related: roll back ECS service to previous task definition revision.
