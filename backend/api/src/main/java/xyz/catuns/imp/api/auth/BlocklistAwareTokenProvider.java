package xyz.catuns.imp.api.auth;

import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.security.core.Authentication;
import xyz.catuns.spring.jwt.auth.AuthTokenProvider;
import xyz.catuns.spring.jwt.core.exception.TokenValidationException;
import xyz.catuns.spring.jwt.core.properties.JwtMetadata;

import java.time.Duration;
import java.time.Instant;

public class BlocklistAwareTokenProvider extends AuthTokenProvider {

    static final String BLOCKLIST_PREFIX = "ims:blocklist:";

    private final StringRedisTemplate redis;

    public BlocklistAwareTokenProvider(JwtMetadata properties, StringRedisTemplate redis) {
        super(properties);
        this.redis = redis;
    }

    @Override
    public Authentication validate(String token) throws TokenValidationException {
        if (Boolean.TRUE.equals(redis.hasKey(BLOCKLIST_PREFIX + token))) {
            throw new TokenValidationException("Token has been revoked");
        }
        return super.validate(token);
    }

    public void block(String token) {
        try {
            Instant expiry = getClaims(token).getExpiration().toInstant();
            long remaining = Duration.between(Instant.now(), expiry).toSeconds();
            if (remaining > 0) {
                redis.opsForValue().set(BLOCKLIST_PREFIX + token, "1", Duration.ofSeconds(remaining));
            }
        } catch (Exception ignored) {
            // token already expired — no need to blocklist
        }
    }
}
