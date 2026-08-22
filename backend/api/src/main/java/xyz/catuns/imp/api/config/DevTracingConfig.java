package xyz.catuns.imp.api.config;

import io.opentelemetry.exporter.logging.LoggingSpanExporter;
import io.opentelemetry.sdk.trace.export.SpanExporter;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.context.annotation.Profile;

/**
 * dev/local have no otel-collector to push spans to (application-dev.yaml and
 * application-local.yaml exclude Spring Boot's OtlpAutoConfiguration), so spans
 * are written to the console instead via OTel's LoggingSpanExporter. Spring Boot
 * picks up any SpanExporter bean automatically and composites it into the SDK
 * tracer provider alongside whatever other exporters are active.
 */
@Configuration
@Profile({"dev", "local"})
public class DevTracingConfig {

    @Bean
    public SpanExporter loggingSpanExporter() {
        return LoggingSpanExporter.create();
    }
}
