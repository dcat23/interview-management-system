package xyz.catuns.imp.api.apikey;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.lang.NonNull;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.util.StringUtils;
import org.springframework.web.filter.OncePerRequestFilter;
import xyz.catuns.imp.api.apikey.entity.ApiKey;
import xyz.catuns.imp.api.apikey.repository.ApiKeyRepository;
import xyz.catuns.imp.api.user.entity.User;
import xyz.catuns.imp.api.user.repository.UserRepository;

import java.io.IOException;
import java.time.Instant;
import java.util.List;

/**
 * Authenticates requests carrying an {@code X-API-Key} header (deliberately not {@code Authorization},
 * so it can't collide with the JWT Bearer scheme). On a valid, non-revoked, non-expired key, sets an
 * Authentication whose principal is the key owner's email and whose sole granted authority is
 * {@code ROLE_AI_AGENT} — never the owning supporter's own role.
 * <p>
 * Positioned before {@code JwtTokenValidatorFilter} in the security chain: once this filter sets an
 * Authentication, the JWT filter's own {@code shouldNotFilter} check causes it to skip, so X-API-Key
 * takes precedence when both headers are present.
 * <p>
 * Invalid, revoked, or expired keys throw {@link BadCredentialsException} (an
 * {@link org.springframework.security.core.AuthenticationException}), which the JWT starter's
 * {@code JwtExceptionHandlerFilter} catches and resolves to the same 401 ProblemDetail shape used for
 * JWT authentication failures.
 */
@RequiredArgsConstructor
public class ApiKeyAuthFilter extends OncePerRequestFilter {

    public static final String API_KEY_HEADER = "X-API-Key";
    public static final String AI_AGENT_AUTHORITY = "ROLE_AI_AGENT";

    private final ApiKeyRepository apiKeyRepository;
    private final UserRepository userRepository;

    @Override
    protected void doFilterInternal(
            @NonNull HttpServletRequest request,
            @NonNull HttpServletResponse response,
            @NonNull FilterChain filterChain
    ) throws ServletException, IOException {

        String rawKey = request.getHeader(API_KEY_HEADER);
        if (!StringUtils.hasText(rawKey)) {
            filterChain.doFilter(request, response);
            return;
        }

        ApiKey apiKey = apiKeyRepository.findByKeyHash(ApiKeyGenerator.hash(rawKey))
                .orElseThrow(() -> new BadCredentialsException("Invalid API key"));

        if (apiKey.isRevoked()) {
            throw new BadCredentialsException("API key has been revoked");
        }
        if (apiKey.getExpiresAt().isBefore(Instant.now())) {
            throw new BadCredentialsException("API key has expired");
        }

        User owner = userRepository.findById(apiKey.getOwnerId())
                .orElseThrow(() -> new BadCredentialsException("API key owner not found"));

        apiKey.setLastUsedAt(Instant.now());
        apiKeyRepository.save(apiKey);

        Authentication authentication = new UsernamePasswordAuthenticationToken(
                owner.getEmail(), null, List.of(new SimpleGrantedAuthority(AI_AGENT_AUTHORITY)));
        SecurityContextHolder.getContext().setAuthentication(authentication);

        filterChain.doFilter(request, response);
    }

    /**
     * Skip if authentication is already present (mirrors JwtTokenValidatorFilter's own guard).
     */
    @Override
    protected boolean shouldNotFilter(HttpServletRequest request) {
        return SecurityContextHolder.getContext().getAuthentication() != null;
    }
}
