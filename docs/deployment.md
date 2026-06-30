# Deployment

## Environments

| Environment | Purpose | Branch | URL |
|---|---|---|---|
| `dev` | Active development, integration testing | `develop` | `dev.api.{domain}` |
| `staging` | Pre-release validation, load testing | `main` | `staging.api.{domain}` |
| `prod` | Live system | tagged release | `api.{domain}` |

---

## AWS infrastructure overview

All infrastructure provisioned via Terraform. State stored in S3 with DynamoDB locking.

```
us-east-1 (primary)
│
├── VPC (10.0.0.0/16)
│   ├── Public subnets (3 AZs)   — ALB
│   └── Private subnets (3 AZs)  — ECS tasks, RDS, ElastiCache, MSK
│
├── ALB (HTTPS :443)
│   └── ACM certificate (*.{domain})
│
├── ECS Fargate
│   ├── api service          (2 tasks min, 10 max)
│   ├── web service          (2 tasks min, 6 max)
│   └── background-job       (1 task, no auto-scaling)
│
├── RDS PostgreSQL 16 (Multi-AZ)
│   └── Read replica (staging + prod)
│
├── ElastiCache Redis 7 (cluster mode disabled, single node dev / cluster staging+prod)
│
├── MSK Kafka 3.5 (3 brokers, Multi-AZ)
│
├── ECR (one repository per service)
│
├── Secrets Manager
│
├── Route 53 (hosted zone)
│
└── CloudWatch + X-Ray
```

---

## ECS task definitions

### API (`apps/api`)

```json
{
  "family": "interview-api",
  "cpu": "512",
  "memory": "1024",
  "networkMode": "awsvpc",
  "containerDefinitions": [
    {
      "name": "api",
      "image": "{account}.dkr.ecr.us-east-1.amazonaws.com/interview-api:{tag}",
      "portMappings": [{ "containerPort": 8080 }],
      "environment": [
        { "name": "SPRING_PROFILES_ACTIVE", "value": "prod" }
      ],
      "secrets": [
        { "name": "DB_URL",           "valueFrom": "arn:aws:secretsmanager:...::db-url" },
        { "name": "DB_PASSWORD",      "valueFrom": "arn:aws:secretsmanager:...::db-password" },
        { "name": "REDIS_URL",        "valueFrom": "arn:aws:secretsmanager:...::redis-url" },
        { "name": "KAFKA_BROKERS",    "valueFrom": "arn:aws:secretsmanager:...::kafka-brokers" },
        { "name": "JWT_SECRET",       "valueFrom": "arn:aws:secretsmanager:...::jwt-secret" }
      ],
      "logConfiguration": {
        "logDriver": "awslogs",
        "options": {
          "awslogs-group": "/app/api",
          "awslogs-region": "us-east-1",
          "awslogs-stream-prefix": "ecs"
        }
      },
      "healthCheck": {
        "command": ["CMD-SHELL", "curl -f http://localhost:8080/actuator/health || exit 1"],
        "interval": 30,
        "timeout": 5,
        "retries": 3,
        "startPeriod": 60
      }
    }
  ]
}
```

### Background job (`services/background-job`)

Same structure as API. `cpu: 256`, `memory: 512`. No port mapping. No ALB target group. Desired count locked at `1`.

---

## Dockerfile conventions

### Spring Boot (`apps/api` and `services/background-job`)

```dockerfile
FROM eclipse-temurin:21-jre-alpine AS runtime
WORKDIR /app
COPY --from=build /app/target/*.jar app.jar
RUN addgroup -S appgroup && adduser -S appuser -G appgroup
USER appuser
EXPOSE 8080
ENTRYPOINT ["java", "-XX:+UseContainerSupport", "-XX:MaxRAMPercentage=75.0", "-jar", "app.jar"]
```

### Next.js (`apps/web`)

```dockerfile
FROM node:20-alpine AS runner
WORKDIR /app
ENV NODE_ENV production
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static
COPY --from=builder /app/public ./public
RUN addgroup -S appgroup && adduser -S appuser -G appgroup && chown -R appuser:appgroup /app
USER appuser
EXPOSE 3000
CMD ["node", "server.js"]
```

---

## CI/CD pipeline (GitHub Actions)

### Trigger matrix

| Workflow | Trigger | Target |
|---|---|---|
| `api-ci.yml` | Push to `develop` or PR targeting `main` | Build + test API |
| `web-ci.yml` | Push to `develop` or PR targeting `main` | Build + test web |
| `job-ci.yml` | Push to `develop` or PR targeting `main` | Build + test background job |
| `deploy.yml` | Push to `main` (staging) or published release (prod) | Deploy all services |

### `api-ci.yml`

```yaml
name: API CI
on:
  push:
    branches: [develop]
    paths: [apps/api/**, docs/**]
  pull_request:
    branches: [main]

jobs:
  build-and-test:
    runs-on: ubuntu-latest
    services:
      postgres:
        image: postgres:16
        env:
          POSTGRES_DB: interview_test
          POSTGRES_PASSWORD: test
        options: >-
          --health-cmd pg_isready --health-interval 10s --health-timeout 5s --health-retries 5
      redis:
        image: redis:7-alpine
        options: --health-cmd "redis-cli ping" --health-interval 10s
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-java@v4
        with: { java-version: '21', distribution: 'temurin', cache: 'maven' }
      - name: Run tests
        run: mvn verify -pl apps/api
        env:
          SPRING_DATASOURCE_URL: jdbc:postgresql://localhost:5432/interview_test
          SPRING_DATASOURCE_PASSWORD: test
          SPRING_REDIS_URL: redis://localhost:6379
      - name: Build image
        run: |
          docker build -t interview-api:${{ github.sha }} apps/api
      - name: Push to ECR
        if: github.ref == 'refs/heads/develop' || github.ref == 'refs/heads/main'
        run: |
          aws ecr get-login-password | docker login --username AWS --password-stdin $ECR_REGISTRY
          docker tag interview-api:${{ github.sha }} $ECR_REGISTRY/interview-api:${{ github.sha }}
          docker push $ECR_REGISTRY/interview-api:${{ github.sha }}
```

### `deploy.yml` (staging + prod)

```yaml
name: Deploy
on:
  push:
    branches: [main]       # → staging
  release:
    types: [published]     # → prod

jobs:
  deploy:
    runs-on: ubuntu-latest
    environment: ${{ github.event_name == 'release' && 'prod' || 'staging' }}
    steps:
      - name: Configure AWS credentials
        uses: aws-actions/configure-aws-credentials@v4
        with:
          role-to-assume: ${{ secrets.AWS_DEPLOY_ROLE_ARN }}
          aws-region: us-east-1

      - name: Run Flyway migrations
        run: |
          aws ecs run-task \
            --cluster interview-${{ env.ENV }} \
            --task-definition interview-db-migration \
            --launch-type FARGATE \
            --network-configuration "..."
          # Wait for task completion before proceeding

      - name: Deploy API (blue/green)
        run: |
          aws ecs update-service \
            --cluster interview-${{ env.ENV }} \
            --service interview-api \
            --task-definition interview-api:${{ env.IMAGE_TAG }} \
            --deployment-configuration "maximumPercent=200,minimumHealthyPercent=100"

      - name: Deploy Web
        run: |
          aws ecs update-service \
            --cluster interview-${{ env.ENV }} \
            --service interview-web \
            --task-definition interview-web:${{ env.IMAGE_TAG }}

      - name: Deploy Background Job
        run: |
          aws ecs update-service \
            --cluster interview-${{ env.ENV }} \
            --service interview-background-job \
            --task-definition interview-background-job:${{ env.IMAGE_TAG }}

      - name: Wait for stable
        run: |
          aws ecs wait services-stable \
            --cluster interview-${{ env.ENV }} \
            --services interview-api interview-web interview-background-job

      - name: Smoke test
        run: curl -f https://${{ env.API_URL }}/actuator/health
```

---

## Database migrations

Flyway runs **before** the new ECS task revision becomes active. A dedicated migration task (same Docker image, different entrypoint) runs and exits before the deployment proceeds.

This is enforced in `deploy.yml` via the `run-task` step with a wait condition before `update-service`.

**Migration entrypoint override:**
```
java -jar app.jar --spring.flyway.enabled=true --spring.main.web-application-type=none
```

---

## Blue/green deployment

ECS rolling update with `maximumPercent=200, minimumHealthyPercent=100`:

1. ECS starts new task revision alongside existing tasks.
2. ALB health check confirms new tasks are healthy (Spring Actuator `/health`).
3. ECS drains connections from old tasks (connection draining: 30s).
4. Old tasks terminated.

Total cutover time: ~2 minutes for 2 tasks.

**Rollback:** `aws ecs update-service --task-definition interview-api:{previous_revision}` — identical process in reverse. Previous image already in ECR.

---

## Terraform structure

```
infrastructure/terraform/
├── modules/
│   ├── vpc/           main.tf, variables.tf, outputs.tf
│   ├── ecs/           cluster, services, task definitions
│   ├── rds/           instance, parameter group, subnet group
│   ├── elasticache/   replication group, subnet group
│   ├── msk/           cluster, configuration
│   ├── alb/           listener, target groups, certificates
│   └── observability/ log groups, dashboards, alarms, RUM
└── envs/
    ├── dev/           main.tf (module calls + dev-specific vars)
    ├── staging/       main.tf
    └── prod/          main.tf
```

**State backend (`envs/{env}/backend.tf`):**
```hcl
terraform {
  backend "s3" {
    bucket         = "interview-platform-tfstate"
    key            = "prod/terraform.tfstate"
    region         = "us-east-1"
    dynamodb_table = "interview-platform-tflock"
    encrypt        = true
  }
}
```

**Apply workflow:**
```bash
cd infrastructure/terraform/envs/prod
terraform init
terraform plan -out=tfplan
terraform apply tfplan
```

Terraform is **not** run automatically in CI. Infrastructure changes are applied manually after review. ECS service task definition updates (image tags) are handled by GitHub Actions, not Terraform, to avoid state drift.

---

## Secret rotation

All secrets stored in AWS Secrets Manager with automatic rotation enabled:

| Secret | Rotation period |
|---|---|
| `db-password` | 30 days (RDS native rotation Lambda) |
| `jwt-secret` | 90 days (custom Lambda) |
| `redis-url` | Not rotated (connection string, not credential) |

On rotation, ECS tasks are restarted to pick up new secret values via a CloudWatch Events rule triggering a Lambda that calls `ecs:update-service --force-new-deployment`.

---

## Rollback playbook

1. Identify failing revision: `aws ecs describe-services --cluster interview-prod --services interview-api`
2. Find previous stable task definition revision number from deployment history.
3. Roll back: `aws ecs update-service --cluster interview-prod --service interview-api --task-definition interview-api:{N-1}`
4. If migration caused the issue: restore from pre-deployment RDS snapshot (point-in-time recovery to 5 minutes before deployment).
5. Verify health: `curl https://api.{domain}/actuator/health`
6. Post incident: file GitHub issue, update runbook.
