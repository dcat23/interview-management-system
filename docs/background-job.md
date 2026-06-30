# Background Job

The background job is a separate Spring Boot application (`services/background-job`) deployed as its own ECS Fargate task. It runs on a fixed schedule, auto-transitioning sessions and dispatching notification events via Kafka.

---

## Responsibilities

1. **Auto-transition:** Query `interview_sessions` where `status = 'scheduled'` and `scheduled_at < now()`. Transition each to `in_review`. Write to `STATUS_HISTORY`. Publish `SessionStatusChanged` to Kafka.
2. **Notification dispatch:** Consume `session.status.changed` topic and publish `NotificationRequested` events to `notifications.send` for relevant transitions.
3. **Email delivery:** Consume `notifications.send` topic and send emails via AWS SES.

---

## Schedule

`@Scheduled(cron = "0 0 * * * *")` — runs at the top of every hour.

The job does **not** run on startup. If the ECS task is restarted mid-hour, the job waits until the next hour boundary.

---

## Concurrency control

Only one instance of the background job task runs at a time (ECS desired count = 1). However, ECS may briefly run two tasks during a deployment. A PostgreSQL advisory lock prevents both instances from executing the transition logic concurrently.

```java
@Scheduled(cron = "0 0 * * * *")
public void run() {
    boolean locked = acquireAdvisoryLock();
    if (!locked) {
        log.info("Could not acquire advisory lock — another instance is running. Skipping.");
        return;
    }
    try {
        executeTransitions();
    } finally {
        releaseAdvisoryLock();
    }
}

private static final long LOCK_KEY = 12345L; // arbitrary consistent key

private boolean acquireAdvisoryLock() {
    return jdbcTemplate.queryForObject(
        "SELECT pg_try_advisory_lock(?)", Boolean.class, LOCK_KEY
    );
}

private void releaseAdvisoryLock() {
    jdbcTemplate.execute("SELECT pg_advisory_unlock(" + LOCK_KEY + ")");
}
```

---

## Auto-transition logic

```java
@Transactional
public void executeTransitions() {
    Instant startTime = Instant.now();
    int count = 0;

    List<InterviewSession> sessions = sessionRepository
        .findByStatusAndScheduledAtBefore(SessionStatus.SCHEDULED, Instant.now());

    for (InterviewSession session : sessions) {
        // Idempotency: re-check status inside transaction
        if (session.getStatus() != SessionStatus.SCHEDULED) continue;

        session.setStatus(SessionStatus.IN_REVIEW);
        session.setStatusChangedAt(Instant.now());
        session.setStatusChangedBy(null);  // background job
        sessionRepository.save(session);

        statusHistoryRepository.save(StatusHistory.builder()
            .sessionId(session.getId())
            .fromStatus(SessionStatus.SCHEDULED)
            .toStatus(SessionStatus.IN_REVIEW)
            .changedBy(null)
            .changeSource(ChangeSource.BACKGROUND_JOB)
            .changedAt(Instant.now())
            .build());

        kafkaProducer.publish("session.status.changed", session.getProcessId().toString(),
            buildStatusChangedEvent(session, SessionStatus.SCHEDULED, SessionStatus.IN_REVIEW));

        count++;
    }

    // Publish metrics
    registry.counter("background.job.sessions.transitioned").increment(count);
    registry.timer("background.job.duration").record(Duration.between(startTime, Instant.now()));
    registry.counter("background.job.executions", "result", "success").increment();

    log.info("JobExecution completed. sessionsTransitioned={} durationMs={}",
        count, Duration.between(startTime, Instant.now()).toMillis());
}
```

---

## Kafka consumer: notification dispatch

Consumer group: `background-job.status-processor`

Listens on `session.status.changed`. For each event, determines which users should be notified and what template to use, then publishes to `notifications.send`.

```java
@KafkaListener(topics = "session.status.changed", groupId = "background-job.status-processor")
public void onStatusChanged(SessionStatusChangedEvent event) {
    // Idempotency check
    if (processedEventRepository.existsByEventId(event.getEventId())) return;

    List<NotificationRequest> notifications = notificationResolver.resolve(event);
    notifications.forEach(n -> kafkaProducer.publish("notifications.send", n.getRecipientId().toString(), n));

    processedEventRepository.save(new ProcessedEvent(event.getEventId()));
}
```

**Notification routing:**

| Transition | Notify |
|---|---|
| `null → scheduled` | Candidate (session scheduled), Supporter (assigned to session) |
| `scheduled → in_review` (auto) | Admin, Marketer (session in review, awaiting feedback) |
| `scheduled → in_review` (manual) | Admin, Marketer |
| `in_review → passed` | Admin, Marketer |
| `in_review → rejected` | Admin, Marketer |
| `scheduled/in_review → cancelled` | Candidate, Supporter |
| `scheduled → no_show` | Admin, Marketer |

---

## Kafka consumer: email delivery

Consumer group: `background-job.notification-sender`

Listens on `notifications.send`. Sends email via AWS SES using pre-configured templates.

```java
@KafkaListener(topics = "notifications.send", groupId = "background-job.notification-sender")
public void onNotificationRequested(NotificationRequestedEvent event) {
    if (processedEventRepository.existsByEventId(event.getEventId())) return;

    sesClient.sendTemplatedEmail(SendTemplatedEmailRequest.builder()
        .destination(d -> d.toAddresses(event.getPayload().getRecipientEmail()))
        .source("noreply@{domain}")
        .template(event.getPayload().getNotificationType().getSesTemplateName())
        .templateData(objectMapper.writeValueAsString(event.getPayload().getTemplateData()))
        .build());

    processedEventRepository.save(new ProcessedEvent(event.getEventId()));
}
```

---

## Processed events cleanup

A separate `@Scheduled` method runs daily and deletes `processed_events` records older than 48 hours:

```java
@Scheduled(cron = "0 0 2 * * *")  // 2am daily
public void cleanupProcessedEvents() {
    processedEventRepository.deleteByProcessedAtBefore(Instant.now().minus(48, HOURS));
}
```

---

## Spring Boot configuration

```yaml
spring:
  datasource:
    url: ${DB_URL}
    password: ${DB_PASSWORD}
    hikari:
      maximum-pool-size: 5   # Low — job has minimal concurrency needs
  kafka:
    bootstrap-servers: ${KAFKA_BROKERS}
    consumer:
      group-id: background-job.status-processor
      auto-offset-reset: earliest
      enable-auto-commit: false
      key-deserializer: org.apache.kafka.common.serialization.StringDeserializer
      value-deserializer: org.springframework.kafka.support.serializer.JsonDeserializer
    producer:
      key-serializer: org.apache.kafka.common.serialization.StringSerializer
      value-serializer: org.springframework.kafka.support.serializer.JsonSerializer

management:
  metrics:
    export:
      cloudwatch:
        namespace: InterviewPlatform/BackgroundJob
        step: 1m
```

---

## Failure modes

| Failure | Behaviour |
|---|---|
| Job throws exception mid-run | Individual session failures are caught and logged. Other sessions continue. Error metric incremented. |
| Kafka publish fails | Retried 3 times with backoff. On final failure, logged as error. Session transition is committed to DB regardless — Kafka is best-effort for notifications. |
| Advisory lock not released | Lock is session-scoped in PostgreSQL — automatically released when the DB connection closes (ECS task restart). |
| Consumer throws on Kafka message | Spring Kafka retries 3 times. After max retries, message routed to DLQ topic. CloudWatch alarm fires on DLQ consumer lag. |
| SES send fails | Logged as error, message retried via Kafka retry mechanism. If SES is unavailable, DLQ accumulates until recovered. |

---

## Local development

Add to `docker-compose.yml` at repo root:

```yaml
services:
  postgres:
    image: postgres:16
    environment:
      POSTGRES_DB: interview_dev
      POSTGRES_PASSWORD: dev
    ports: ["5432:5432"]

  redis:
    image: redis:7-alpine
    ports: ["6379:6379"]

  kafka:
    image: confluentinc/cp-kafka:7.5.0
    environment:
      KAFKA_ZOOKEEPER_CONNECT: zookeeper:2181
      KAFKA_ADVERTISED_LISTENERS: PLAINTEXT://localhost:9092
    ports: ["9092:9092"]
    depends_on: [zookeeper]

  zookeeper:
    image: confluentinc/cp-zookeeper:7.5.0
    environment:
      ZOOKEEPER_CLIENT_PORT: 2181
```

Run all services: `docker compose up -d`  
Run background job locally: `./mvnw spring-boot:run -pl services/background-job -Dspring-boot.run.profiles=dev`
