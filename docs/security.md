# Security

---

## Authentication

### JWT (JSON Web Tokens)

| Property | Value |
|---|---|
| Algorithm | `HS256` (HMAC-SHA256) |
| Access token TTL | 1 hour |
| Refresh token TTL | 7 days |
| Secret storage | AWS Secrets Manager (`jwt-secret`) |
| Secret rotation | Every 90 days via Lambda |

**Access token payload:**
```json
{
  "sub": "user-uuid",
  "role": "supporter",
  "iat": 1705312800,
  "exp": 1705316400
}
```

**Token flow:**
1. `POST /auth/login` → returns `access_token` + `refresh_token`
2. Client stores `access_token` in memory (not localStorage), `refresh_token` in `HttpOnly` cookie
3. API calls include `Authorization: Bearer {access_token}`
4. On 401, client calls `POST /auth/refresh` using the cookie — transparently rotates tokens
5. `POST /auth/logout` → server adds `refresh_token` to Redis blocklist (TTL = remaining token lifetime)

### API key authentication

An alternative authentication path for MCP-capable AI clients (Claude Desktop, claude.ai, Perplexity) calling the API directly during a live interview, instead of a human operating the dashboard with a JWT. One issued key is presented over either of two transports, chosen by what the calling client supports:

| Property           | `X-API-Key` (REST/programmatic)                                                                               | `Authorization: Bearer` (MCP hosted connectors)                                                                                                                       |
|--------------------|---------------------------------------------------------------------------------------------------------------|-----------------------------------------------------------------------------------------------------------------------------------------------------------------------|
| Format             | `aik_` + 43 base62 chars drawn from `SecureRandom` (~256 bits of entropy)                                     | A JWT wrapping the same key's id (`sub`), signed with the app's existing JWT secret                                                                                   |
| Validation         | SHA-256 hash lookup against the stored `key_hash`                                                             | Signature + claims parsing via `ApiKeyTokenProvider` (extends jwt-core's `SimpleTokenProvider`); the key row is still re-resolved on every call to enforce revocation |
| Why this transport | Deliberately not `Authorization`, so it can't collide with the JWT Bearer scheme, for direct/scripted callers | Hosted connector "add connector" UIs (Claude, Perplexity) only expose a bearer-token-shaped auth field, not a custom header                                           |

Both resolve to the same `ApiKey` row, the same owning supporter, and the same granted authority. Only the raw key (`X-API-Key` use) is hashed and stored; the bearer JWT is never persisted — it's self-verifying and stateless, re-derivable only by revoking the key and issuing a new one.

| Property             | Value                                                                                                                                              |
|----------------------|----------------------------------------------------------------------------------------------------------------------------------------------------|
| Storage              | SHA-256 hash of the raw key + a 12-char plaintext prefix only — both credentials are shown once, at issuance, and never stored in recoverable form |
| Granted authority    | `ROLE_AI_AGENT` only — never the issuing supporter's own role                                                                                      |
| Default / max expiry | 90 days / 180 days — mirrored onto the bearer JWT's own `exp` claim at issuance                                                                    |
| Issuance             | `POST /api-keys`, self-service, by the owning supporter (or admin) — see [API reference](api-reference.md#api-keys)                                |

**Why a distinct authority, not the owner's role:** a key is issued by and tied to an owning supporter, but the intent is a narrow, audit-friendly grant for one workflow (question capture) — not "give this AI client everything the supporter can do." `ROLE_AI_AGENT` is attached only to API-key-authenticated requests and is never present on a human's JWT-derived `Authentication`.

**Chain wiring:** `ApiKeyAuthFilter` runs ahead of the JWT validator filter in the same `SecurityFilterChain`. `X-API-Key`, if present, is authoritative and validated strictly — invalid, revoked, or expired keys are rejected with `401` before reaching any controller, using the same `ProblemDetail` error shape as JWT failures. Otherwise, an `Authorization: Bearer` token is tried as an API-key JWT; if that fails (wrong signature, no matching row — i.e. it's not one of ours), the filter does *not* reject the request, it passes through untouched so `JwtTokenValidatorFilter` gets the next look, keeping human JWT logins on that same header unaffected.

**Rate limiting and audit:** not yet key-specific — API-key traffic currently falls under the standard per-user limit below, since it resolves to the owning supporter. A dedicated per-key Redis limit and `createdByApiKeyId` write attribution are planned but not yet implemented.

---

**Spring Security filter chain:**
```java
@Bean
public SecurityFilterChain filterChain(HttpSecurity http) throws Exception {
    return http
        .csrf(csrf -> csrf.disable())           // Stateless API — CSRF not applicable
        .sessionManagement(sm -> sm.sessionCreationPolicy(STATELESS))
        .addFilterBefore(jwtAuthFilter, UsernamePasswordAuthenticationFilter.class)
        .authorizeHttpRequests(auth -> auth
            .requestMatchers("/auth/login", "/auth/refresh").permitAll()
            .requestMatchers("/actuator/health").permitAll()
            .anyRequest().authenticated()
        )
        .build();
}
```

---

## Authorization (RBAC)

Role is embedded in the JWT and extracted on every request. `@PreAuthorize` annotations on service methods enforce access. Controller layer is role-agnostic.

### Role permission matrix

| Resource | `candidate` | `marketer` | `supporter` | `admin` | `ai_agent` |
|---|---|---|---|---|---|
| Own user profile | read | read | read | full | — |
| All users | — | — | — | full | — |
| End clients | — | create/read/update | read | full | read (unscoped) |
| Interview processes | own read | full | assigned read | full | — |
| Interview sessions | own read | full | assigned read | full | read (unscoped) |
| Session status transition | — | pre-interview states | post-interview outcomes | any | — |
| Questions (bank) | — | — | read/create | full | read (unscoped) |
| Session questions | own read | — | read/create/update/delete | full | read/create (unscoped — no update/delete) |
| Feedback | — | read (submitted) | own read/create/update | read all submitted | — |
| Status history | — | read | — | full | — |
| Process timeline | — | read | — | full | — |

`ai_agent` reads are deliberately *not* scoped to the issuing supporter's own assignments (unlike `supporter`), but its write surface is narrower than any human role: only question creation and session-question linking, via `X-API-Key` — see [API key authentication](#api-key-authentication).

### Service-layer enforcement example

```java
@Service
public class SessionStatusService {

    @PreAuthorize("""
        hasRole('ADMIN') or
        (hasRole('MARKETER') and #transition.isPreInterviewTransition()) or
        (hasRole('SUPPORTER') and #transition.isPostInterviewTransition() and @sessionService.isAssignedSupporter(#sessionId, authentication.name))
    """)
    public void transition(UUID sessionId, StatusTransition transition) {
        // ...
    }
}
```

### Data scoping (row-level security)

Role checks at the method level are not sufficient alone. Queries must also scope data to what the caller is permitted to see:

- **Candidate:** `WHERE candidate_id = :currentUserId`
- **Supporter:** `WHERE supporter_id = :currentUserId`
- **Marketer:** `WHERE marketer_id = :currentUserId` (for owned processes); all sessions within those processes
- **Admin:** No additional filter

This is implemented via Spring Data JPA Specifications passed in from the service layer based on the current user's role. Never rely solely on the frontend to hide data — all scoping is enforced on the backend.

---

## Transport security

- **HTTPS enforced at ALB.** HTTP listener (port 80) redirects to HTTPS (port 443). ACM certificate covers `*.{domain}`.
- **Internal traffic** (ECS task to RDS, Redis, Kafka) runs within the private VPC subnet. Security groups restrict inbound access to known service ports only.
- **TLS on RDS and MSK.** `require_ssl = 1` on RDS parameter group. MSK `clientBrokerEncryption = TLS`.
- **HSTS header** set on all API responses: `Strict-Transport-Security: max-age=31536000; includeSubDomains`

---

## Input validation

All request DTOs annotated with Jakarta Bean Validation constraints:

```java
public record CreateSessionRequest(
    @NotNull UUID supporterId,
    @NotBlank @Size(max = 100) String round,
    @NotBlank @Size(max = 100) String mode,
    @Min(15) @Max(480) int durationMinutes,
    @NotNull @Future Instant scheduledAt,
    @Size(max = 2000) String description
) {}
```

Spring MVC automatically returns `400` with field-level error details on constraint violation. No custom validation code required for standard constraints.

**SQL injection:** Not possible. All database access via JPA/Hibernate with parameterised queries. No native SQL string concatenation permitted.

**Mass assignment:** Request DTOs are separate from JPA entities. Fields not in the DTO cannot be set via the API regardless of request body content.

---

## CORS

Configured per environment. Only the frontend domain is permitted.

```java
@Bean
public CorsConfigurationSource corsConfigurationSource() {
    CorsConfiguration config = new CorsConfiguration();
    config.setAllowedOrigins(List.of(frontendUrl));   // from env var
    config.setAllowedMethods(List.of("GET","POST","PATCH","DELETE","OPTIONS"));
    config.setAllowedHeaders(List.of("Authorization","Content-Type"));
    config.setAllowCredentials(true);
    config.setMaxAge(3600L);

    UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
    source.registerCorsConfiguration("/**", config);
    return source;
}
```

---

## Secrets management

All credentials in AWS Secrets Manager. No secrets in:
- Source code
- `.env` files
- ECS task definition environment variables (use `secrets` field, not `environment`)
- CloudWatch Logs
- GitHub Actions environment variables (use GitHub Secrets with OIDC role assumption)

**GitHub Actions → AWS authentication:** OIDC (no long-lived AWS credentials stored in GitHub):

```yaml
- uses: aws-actions/configure-aws-credentials@v4
  with:
    role-to-assume: arn:aws:iam::{account}:role/github-actions-deploy
    aws-region: us-east-1
```

---

## Rate limiting

Implemented at the ALB / application layer:

| Endpoint | Limit | Scope |
|---|---|---|
| `POST /auth/login` | 10 req/min | Per IP |
| `POST /auth/refresh` | 20 req/min | Per IP |
| All authenticated endpoints | 300 req/min | Per user (from JWT `sub`) |

Rate limit state stored in Redis. `429 Too Many Requests` returned with `Retry-After` header on breach.

Auth failure rate monitored via CloudWatch alarm (`auth.failures > 50/min` → high severity alert).

---

## OWASP Top 10 mitigations

| Risk | Mitigation |
|---|---|
| A01 Broken Access Control | `@PreAuthorize` on all service methods; data scoping in all queries; role extracted from JWT not request |
| A02 Cryptographic Failures | BCrypt for passwords; SHA-256 for API keys (256-bit `SecureRandom` key material, so slow salted hashing buys nothing); HS256 JWT; TLS on all connections; secrets in Secrets Manager |
| A03 Injection | JPA parameterised queries; Bean Validation on all inputs; no dynamic SQL |
| A04 Insecure Design | Separate DTOs from entities; immutable status history; feedback locked on submission |
| A05 Security Misconfiguration | CORS locked to frontend domain; HTTPS-only; security headers on all responses |
| A06 Vulnerable Components | Dependabot enabled on GitHub repo; weekly dependency update PRs |
| A07 Auth Failures | Rate limiting on auth endpoints; refresh token rotation; Redis blocklist on logout |
| A08 Software Integrity | Docker images built in CI from pinned base images; ECR image scanning enabled |
| A09 Logging Failures | Structured JSON logging; auth failures logged with IP; no sensitive data in logs |
| A10 SSRF | No user-supplied URLs fetched by the backend |

---

## Security headers

Added via Spring Boot filter on all responses:

```
Strict-Transport-Security: max-age=31536000; includeSubDomains
X-Content-Type-Options: nosniff
X-Frame-Options: DENY
Content-Security-Policy: default-src 'self'
Referrer-Policy: strict-origin-when-cross-origin
```

---

## Audit logging

Every state-changing operation logs the following at `INFO` level in structured JSON:

```json
{
  "audit": true,
  "action": "SESSION_STATUS_CHANGED",
  "userId": "uuid",
  "userRole": "supporter",
  "resourceType": "InterviewSession",
  "resourceId": "uuid",
  "before": "scheduled",
  "after": "in_review",
  "timestamp": "2024-02-15T15:00:00Z",
  "traceId": "x-ray-trace-id"
}
```

`STATUS_HISTORY` table provides durable audit trail for session transitions specifically. CloudWatch Logs provides full audit for all other operations with 90-day retention in production.
