package xyz.catuns.imp.api.apikey;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.lang.NonNull;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.util.StringUtils;
import org.springframework.web.filter.OncePerRequestFilter;
import xyz.catuns.imp.api.apikey.entity.ApiKey;
import xyz.catuns.imp.api.apikey.repository.ApiKeyRepository;
import xyz.catuns.imp.api.user.entity.User;
import xyz.catuns.imp.api.user.repository.UserRepository;
import xyz.catuns.spring.jwt.core.exception.TokenValidationException;

import java.io.IOException;
import java.time.Instant;
import java.util.List;

/**
 * Authenticates AI-agent requests over two transports, both resolving to the same {@link ApiKey}
 * row and granting the same single authority, {@code ROLE_AI_AGENT} — never the owning supporter's
 * own role:
 * <ul>
 *   <li>{@code X-API-Key: <raw key>} — the original self-service credential, an opaque
 *       {@code aik_}-prefixed random string, hashed and looked up via {@link ApiKeyRepository}.
 *       For direct REST/programmatic callers.</li>
 *   <li>{@code Authorization: Bearer <jwt>} — a JWT wrapping the same key's id, issued alongside
 *       the raw key at creation time (see {@link ApiKeyService#create}) and validated via
 *       {@link ApiKeyTokenProvider}. Added for MCP hosted connectors (Claude, Perplexity), whose
 *       "add connector" UI only exposes a bearer-token-shaped auth field, not a custom header.</li>
 * </ul>
 * The two transports never collide: {@code X-API-Key} is unambiguous by name and always validated
 * strictly, while a bearer token that fails API-key validation (wrong signature, no matching row)
 * is treated as "not one of ours" and passed through untouched rather than rejected —
 * {@code JwtTokenValidatorFilter} gets the next look, so a genuine human JWT on that same header
 * still authenticates normally.
 * <p>
 * Positioned before {@code JwtTokenValidatorFilter} in the security chain: once this filter sets an
 * Authentication, the JWT filter's own {@code shouldNotFilter} check causes it to skip.
 * <p>
 * An invalid, revoked, or expired {@code X-API-Key} throws {@link BadCredentialsException} (an
 * {@link org.springframework.security.core.AuthenticationException}), which the JWT starter's
 * {@code JwtExceptionHandlerFilter} catches and resolves to the same 401 ProblemDetail shape used
 * for JWT authentication failures.
 */
@RequiredArgsConstructor
public class ApiKeyAuthFilter extends OncePerRequestFilter {

    public static final String API_KEY_HEADER = "X-API-Key";
    public static final String AI_AGENT_AUTHORITY = "ROLE_AI_AGENT";

    private static final String AUTHORIZATION_HEADER = "Authorization";
    private static final String BEARER_PREFIX = "Bearer ";

    private final ApiKeyRepository apiKeyRepository;
    private final ApiKeyTokenProvider apiKeyTokenProvider;
    private final UserRepository userRepository;

    @Override
    protected void doFilterInternal(
            @NonNull HttpServletRequest request,
            @NonNull HttpServletResponse response,
            @NonNull FilterChain filterChain
    ) throws ServletException, IOException {

        ApiKey apiKey = resolveApiKey(request);
        if (apiKey == null) {
            filterChain.doFilter(request, response);
            return;
        }

        User owner = userRepository.findById(apiKey.getOwnerId())
                .orElseThrow(() -> new BadCredentialsException("API key owner not found"));

        UsernamePasswordAuthenticationToken authentication = new UsernamePasswordAuthenticationToken(
                owner.getEmail(), null, List.of(new SimpleGrantedAuthority(AI_AGENT_AUTHORITY)));
        // Carries the specific ApiKey id (not just the owning user) for RequestLoggingFilter's
        // access log — traceable back to the key that made the call, per docs/observability.md.
        authentication.setDetails(apiKey.getId());
        SecurityContextHolder.getContext().setAuthentication(authentication);

        filterChain.doFilter(request, response);
    }

    /**
     * {@code X-API-Key}, if present, is authoritative and validated strictly. Otherwise, an
     * {@code Authorization: Bearer} token is tried as an API-key JWT — but only a {@code null}
     * return (not an exception) signals "not ours," so the request falls through to the JWT
     * filter instead of being rejected outright.
     */
    private ApiKey resolveApiKey(HttpServletRequest request) {
        String rawKey = request.getHeader(API_KEY_HEADER);
        if (StringUtils.hasText(rawKey)) {
            return resolveRawKey(rawKey);
        }

        String authorization = request.getHeader(AUTHORIZATION_HEADER);
        if (StringUtils.hasText(authorization) && authorization.startsWith(BEARER_PREFIX)) {
            try {
                return apiKeyTokenProvider.validate(authorization.substring(BEARER_PREFIX.length()));
            } catch (TokenValidationException e) {
                return null;
            }
        }
        return null;
    }

    private ApiKey resolveRawKey(String rawKey) {
        ApiKey apiKey = apiKeyRepository.findByKeyHash(ApiKeyGenerator.hash(rawKey))
                .orElseThrow(() -> new BadCredentialsException("Invalid API key"));

        if (apiKey.isRevoked()) {
            throw new BadCredentialsException("API key has been revoked");
        }
        if (apiKey.getExpiresAt().isBefore(Instant.now())) {
            throw new BadCredentialsException("API key has expired");
        }

        apiKey.setLastUsedAt(Instant.now());
        return apiKeyRepository.save(apiKey);
    }

    /**
     * Skip if authentication is already present (mirrors JwtTokenValidatorFilter's own guard).
     */
    @Override
    protected boolean shouldNotFilter(HttpServletRequest request) {
        return SecurityContextHolder.getContext().getAuthentication() != null;
    }
}