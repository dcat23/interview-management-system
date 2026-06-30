# Local Development

---

## Prerequisites

| Tool | Version | Install |
|---|---|---|
| Java (Temurin) | 21 | `brew install --cask temurin@21` |
| Maven | 3.9+ | Bundled via `./mvnw` wrapper |
| Node.js | 20 LTS | `brew install node@20` |
| Docker Desktop | Latest | https://www.docker.com/products/docker-desktop |
| AWS CLI | 2.x | `brew install awscli` |
| Terraform | 1.7+ | `brew install terraform` |

---

## Repository setup

```bash
git clone git@github.com:{org}/interview-platform.git
cd interview-platform
```

---

## Environment variables

Copy the example env files. Never commit actual values.

```bash
cp apps/api/.env.example          apps/api/.env.local
cp apps/web/.env.example          apps/web/.env.local
cp services/background-job/.env.example  services/background-job/.env.local
```

**`apps/api/.env.local`**
```bash
SPRING_DATASOURCE_URL=jdbc:postgresql://localhost:5432/interview_dev
SPRING_DATASOURCE_USERNAME=postgres
SPRING_DATASOURCE_PASSWORD=dev
SPRING_REDIS_URL=redis://localhost:6379
KAFKA_BROKERS=localhost:9092
JWT_SECRET=local-dev-secret-min-32-chars-long
AWS_REGION=us-east-1
SPRING_PROFILES_ACTIVE=dev
```

**`apps/web/.env.local`**
```bash
NEXT_PUBLIC_API_URL=http://localhost:8080/v1
```

---

## Start infrastructure (Docker Compose)

```bash
docker compose up -d
```

**`docker-compose.yml`** at repo root provides:
- PostgreSQL 16 on port `5432`
- Redis 7 on port `6379`
- Kafka on port `9092` (with Zookeeper)
- Kafka UI on port `8081` (https://github.com/provectus/kafka-ui)

Verify all services healthy:
```bash
docker compose ps
```

---

## Run the API

```bash
cd apps/api
./mvnw spring-boot:run
```

Flyway migrations run automatically on startup. API available at `http://localhost:8080`.

Swagger UI: `http://localhost:8080/swagger-ui.html`  
Actuator health: `http://localhost:8080/actuator/health`

---

## Run the frontend

```bash
cd apps/web
npm install
npm run dev
```

Frontend available at `http://localhost:3000`.

---

## Run the background job

```bash
cd services/background-job
./mvnw spring-boot:run
```

The job runs on its cron schedule (top of every hour). To trigger manually during development:

```bash
curl -X POST http://localhost:8090/actuator/job/trigger
```

(Dev-only actuator endpoint — disabled in staging and prod via Spring profile.)

---

## Seed data

A Flyway migration (`V99__dev_seed_data.sql`) runs in `dev` profile only, populating:
- 1 admin user (`admin@dev.local` / `password123`)
- 1 marketer (`marketer@dev.local` / `password123`)
- 2 supporters (`supporter1@dev.local`, `supporter2@dev.local` / `password123`)
- 3 candidates (`candidate1@dev.local` through `candidate3@dev.local` / `password123`)
- 2 end clients
- 5 questions in the bank
- 1 active process with 2 sessions

This migration is excluded from staging and prod via:
```java
@Bean
@Profile("dev")
public FlywayConfigurationCustomizer devSeedMigration() {
    return config -> config.locations("classpath:db/migration", "classpath:db/seed");
}
```

---

## Running tests

### API unit + integration tests

```bash
cd apps/api
./mvnw verify
```

Testcontainers automatically starts PostgreSQL, Redis, and Kafka containers for integration tests. Docker must be running.

### Frontend tests

```bash
cd apps/web
npm run test          # Jest unit tests
npm run test:e2e      # Playwright E2E (requires API running)
```

### Full CI run locally

```bash
# Simulate CI pipeline
./mvnw verify -pl apps/api
./mvnw verify -pl services/background-job
cd apps/web && npm ci && npm run build && npm test
```

---

## Common tasks

### Reset the database

```bash
docker compose down -v   # removes volumes
docker compose up -d postgres
cd apps/api && ./mvnw spring-boot:run  # Flyway re-runs all migrations
```

### Add a Flyway migration

Create `apps/api/src/main/resources/db/migration/V{N}__{description}.sql`. Use the next available version number. Flyway runs it automatically on next startup.

### Generate OpenAPI spec

```bash
cd apps/api
./mvnw verify -Dspringdoc.api-docs.enabled=true
# Spec written to apps/api/target/openapi.yaml
cp apps/api/target/openapi.yaml docs/openapi.yaml
```

### View Kafka topics (local)

Open Kafka UI at `http://localhost:8081`. Topics `session.status.changed` and `notifications.send` are created automatically on first producer publish.

Or via CLI:
```bash
docker exec -it $(docker compose ps -q kafka) \
  kafka-topics.sh --bootstrap-server localhost:9092 --list
```

---

## IDE setup

### IntelliJ IDEA
1. Open root `pom.xml` as a Maven project
2. Mark `apps/api/src/main/java` as Sources Root
3. Install the **Lombok** plugin
4. Enable annotation processing: `Settings → Build → Compiler → Annotation Processors → Enable`

### VS Code (frontend)
Recommended extensions (`.vscode/extensions.json` committed to repo):
- `bradlc.vscode-tailwindcss`
- `esbenp.prettier-vscode`
- `dbaeumer.vscode-eslint`
- `ms-playwright.playwright`

---

## Troubleshooting

**`Connection refused` on startup**  
Docker containers not running. Run `docker compose up -d` and wait 10 seconds.

**`Flyway migration checksum mismatch`**  
A committed migration file was modified after it ran. Never edit committed migrations. Create a new migration to correct the issue.

**`JWT signature verification failed` on API calls**  
`JWT_SECRET` mismatch between `.env.local` and the running API. Restart the API after changing env vars.

**Kafka consumer not receiving messages**  
Check consumer group offset: `docker exec -it {kafka-container} kafka-consumer-groups.sh --bootstrap-server localhost:9092 --describe --group background-job.status-processor`. If lag is 0, messages were consumed. If the consumer never started, check the background job logs.

**Port already in use**  
`lsof -ti:8080 | xargs kill` (API) or `lsof -ti:3000 | xargs kill` (web).
