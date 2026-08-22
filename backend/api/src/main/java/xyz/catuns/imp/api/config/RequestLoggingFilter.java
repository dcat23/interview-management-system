package xyz.catuns.imp.api.config;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.extern.slf4j.Slf4j;
import org.springframework.lang.NonNull;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.filter.OncePerRequestFilter;
import xyz.catuns.imp.api.apikey.ApiKeyAuthFilter;

import java.io.IOException;

import static net.logstash.logback.argument.StructuredArguments.kv;

/**
 * Logs one structured line per request — method, path, status, durationMs, and (once
 * authentication has run) the resolved caller — regardless of how the request terminates.
 * Registered ahead of {@link ApiKeyAuthFilter} (see {@link SecurityConfig}), so
 * unauthenticated and rejected requests are logged too, not just successful ones.
 * traceId/spanId are not logged explicitly here — they're already in every line via MDC
 * (see logback-spring.xml) once micrometer-tracing-bridge-otel is on the classpath.
 * <p>
 * This is the concrete tool for diagnosing "did the request even reach the container" —
 * e.g. distinguishing a Cloudflare-tunnel request that never arrives (silence in this log,
 * meaning the failure is at the Cloudflare edge/dashboard, outside this app) from one that
 * arrives and then fails inside the application (a line here followed by a non-2xx status).
 */
@Slf4j
public class RequestLoggingFilter extends OncePerRequestFilter {

    /**
     * The Docker healthcheck hits this every 10s (see docker-compose.yml), forever, for
     * the life of the container — logged like any other request, it dwarfs real traffic
     * in volume for no diagnostic value (a failing healthcheck already surfaces via
     * `docker ps`/`docker inspect`). Tracing/metrics sampling is separate instrumentation
     * and unaffected by this — see the sampling.probability override for docker/local.
     */
    @Override
    protected boolean shouldNotFilter(HttpServletRequest request) {
        return request.getRequestURI().startsWith("/actuator/health");
    }

    @Override
    protected void doFilterInternal(
            @NonNull HttpServletRequest request,
            @NonNull HttpServletResponse response,
            @NonNull FilterChain filterChain
    ) throws ServletException, IOException {

        long start = System.currentTimeMillis();
        try {
            filterChain.doFilter(request, response);
        } finally {
            long durationMs = System.currentTimeMillis() - start;
            log.info("request completed",
                    kv("method", request.getMethod()),
                    kv("path", request.getRequestURI()),
                    kv("status", response.getStatus()),
                    kv("durationMs", durationMs),
                    kv("principal", principal()),
                    kv("apiKeyId", apiKeyId()));
        }
    }

    /**
     * Null until whichever auth filter runs later in the chain sets a SecurityContext —
     * i.e. still null for requests rejected before authentication (missing/garbage
     * credentials), which is itself useful signal in the log line.
     */
    private String principal() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        return authentication != null ? authentication.getName() : null;
    }

    /**
     * Distinguishes ROLE_AI_AGENT (MCP/API-key) traffic from human JWT traffic in the same
     * log stream, per the specific ApiKey that made the call rather than just its owner.
     */
    private Object apiKeyId() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        if (authentication == null) {
            return null;
        }
        boolean isAgent = authentication.getAuthorities().stream()
                .anyMatch(authority -> ApiKeyAuthFilter.AI_AGENT_AUTHORITY.equals(authority.getAuthority()));
        return isAgent ? authentication.getDetails() : null;
    }
}
