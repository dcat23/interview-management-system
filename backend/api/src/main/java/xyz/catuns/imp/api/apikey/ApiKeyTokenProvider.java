package xyz.catuns.imp.api.apikey;

import xyz.catuns.imp.api.apikey.entity.ApiKey;
import xyz.catuns.imp.api.apikey.repository.ApiKeyRepository;
import xyz.catuns.spring.jwt.core.properties.JwtMetadata;
import xyz.catuns.spring.jwt.core.provider.SimpleTokenProvider;
import xyz.catuns.spring.jwt.core.provider.TokenGenerator;
import xyz.catuns.spring.jwt.core.provider.TokenValidator;

import java.time.Instant;
import java.util.Date;
import java.util.NoSuchElementException;
import java.util.UUID;

/**
 * Issues and validates the JWT presented as an {@link ApiKey}'s {@code Authorization: Bearer}
 * credential — the transport MCP hosted connector UIs (Claude, Perplexity) expect, since their
 * "add connector" auth field takes a bearer token, not an arbitrary custom header. Follows the
 * same jwt-core {@link SimpleTokenProvider} pattern {@code AuthTokenProvider} uses for human
 * logins, rather than a bespoke opaque-string scheme, so the credential is a structurally valid
 * JWT rather than the {@code aik_}-prefixed random string still used for the {@code X-API-Key}
 * REST/programmatic path (see {@link ApiKeyAuthFilter}).
 * <p>
 * The token carries only the {@link ApiKey}'s id, as {@code sub}. {@link #generate} is always
 * called with {@code expiresAt} already set on the entity (see {@link ApiKeyService#create}), and
 * the generator overrides the provider's own fixed base duration with that per-key value, so each
 * key gets its own expiry from one shared provider instance. {@link #validate} re-resolves the row
 * on every call — so revocation is enforced even though it can't be embedded statelessly in the
 * token — and touches {@code lastUsedAt}, exactly like the {@code X-API-Key} path.
 */
public class ApiKeyTokenProvider extends SimpleTokenProvider<ApiKey> {

    public ApiKeyTokenProvider(JwtMetadata jwtProperties, ApiKeyRepository apiKeyRepository) {
        this(jwtProperties, defaultTokenGenerator(), defaultTokenValidator(apiKeyRepository));
    }

    public ApiKeyTokenProvider(JwtMetadata jwtProperties, TokenGenerator<ApiKey> customizer,
                                TokenValidator<ApiKey> validator) {
        super(jwtProperties, customizer, validator);
    }

    public static TokenGenerator<ApiKey> defaultTokenGenerator() {
        return (jwt, apiKey) -> jwt
                .subject(apiKey.getId().toString())
                .expiration(Date.from(apiKey.getExpiresAt()));
    }

    public static TokenValidator<ApiKey> defaultTokenValidator(ApiKeyRepository apiKeyRepository) {
        return claims -> {
            UUID apiKeyId = UUID.fromString(claims.getSubject());
            ApiKey apiKey = apiKeyRepository.findById(apiKeyId)
                    .orElseThrow(() -> new NoSuchElementException("API key not found"));
            if (apiKey.isRevoked()) {
                throw new IllegalStateException("API key has been revoked");
            }
            apiKey.setLastUsedAt(Instant.now());
            return apiKeyRepository.save(apiKey);
        };
    }
}