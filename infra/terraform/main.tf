locals {
  # Secret Manager secrets the api reads. Terraform owns the secret containers and access;
  # the values are added out-of-band with set-secrets.sh so they never land in state.
  env_secrets = {
    DATABASE_PASSWORD = "${var.service_name}-database-password"
    REDIS_PASSWORD    = "${var.service_name}-redis-password"
    JWT_SECRET        = "${var.service_name}-jwt-secret"
  }

  # Aiven client certs, mounted as files. Cloud Run gives each secret volume its own
  # directory, so application-aiven.yaml takes one path override per file.
  file_secrets = {
    kafka-service-cert = { secret_id = "${var.service_name}-kafka-service-cert", file = "service.cert", env = "KAFKA_SSL_CERT" }
    kafka-service-key  = { secret_id = "${var.service_name}-kafka-service-key", file = "service.key", env = "KAFKA_SSL_KEY" }
    kafka-ca-cert      = { secret_id = "${var.service_name}-kafka-ca-cert", file = "ca.pem", env = "KAFKA_SSL_CA" }
  }

  all_secret_ids = concat(values(local.env_secrets), [for s in values(local.file_secrets) : s.secret_id])

  plain_env = merge({
    SPRING_PROFILES_ACTIVE = var.spring_profiles
    DATABASE_HOST          = var.database.host
    DATABASE_PORT          = tostring(var.database.port)
    DATABASE_NAME          = var.database.name
    DATABASE_USER          = var.database.user
    REDIS_HOST             = var.redis.host
    REDIS_PORT             = tostring(var.redis.port)
    REDIS_SSL_ENABLED      = tostring(var.redis.ssl_enabled)
    BOOTSTRAP_SERVERS      = var.kafka.bootstrap_servers
    KAFKA_REPLICAS         = tostring(var.kafka.replicas)
    # Cloud Run exposes the container's cgroup limit, so percentage-based heap sizing works
    # here (unlike the nested-docker dev box that needed a fixed -Xmx).
    JAVA_TOOL_OPTIONS = "-XX:MaxRAMPercentage=75.0"
    # application-prod.yaml pushes OTLP to a localhost collector sidecar (the ECS/ADOT
    # design). There is no collector on Cloud Run yet, so turn the exporters off rather
    # than log a failed push every minute. Logs still reach Cloud Logging via stdout.
    MANAGEMENT_OTLP_TRACING_EXPORT_ENABLED = "false"
    MANAGEMENT_OTLP_METRICS_EXPORT_ENABLED = "false"
    }, {
    for k, s in local.file_secrets : s.env => "file:/secrets/${k}/${s.file}"
  }, var.extra_env)
}
