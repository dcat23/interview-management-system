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

| Resource | `candidate` | `marketer` | `supporter` | `admin` |
|---|---|---|---|---|
| Own user profile | read | read | read | full |
| All users | — | — | — | full |
| End clients | — | create/read/update | read | full |
| Interview processes | own read | full | assigned read | full |
| Interview sessions | own read | full | assigned read | full |
| Session status transition | — | pre-interview states | post-interview outcomes | any |
| Questions (bank) | — | — | read/create | full |
| Session questions | own read | — | read/create/update/delete | full |
| Feedback | — | read (submitted) | own read/create/update | read all submitted |
| Status history | — | read | — | full |
| Process timeline | — | read | — | full |

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
| A02 Cryptographic Failures | BCrypt for passwords; HS256 JWT; TLS on all connections; secrets in Secrets Manager |
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
