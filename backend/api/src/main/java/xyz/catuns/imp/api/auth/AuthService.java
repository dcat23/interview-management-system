package xyz.catuns.imp.api.auth;

import lombok.RequiredArgsConstructor;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.authority.AuthorityUtils;
import org.springframework.stereotype.Service;
import xyz.catuns.imp.api.auth.dto.LoginRequest;
import xyz.catuns.imp.api.auth.dto.LoginResponse;
import xyz.catuns.imp.api.auth.dto.RefreshRequest;
import xyz.catuns.imp.api.auth.dto.RefreshResponse;
import xyz.catuns.imp.api.user.entity.User;
import xyz.catuns.imp.api.user.repository.UserRepository;
import xyz.catuns.spring.base.exception.controller.UnauthorizedException;
import xyz.catuns.spring.jwt.core.model.JwtToken;

import java.time.Duration;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class AuthService {

    static final String REFRESH_PREFIX = "ims:refresh:";
    static final Duration REFRESH_TTL = Duration.ofDays(7);

    private final AuthenticationManager authenticationManager;
    private final BlocklistAwareTokenProvider tokenProvider;
    private final StringRedisTemplate redis;
    private final UserRepository userRepository;

    public LoginResponse login(LoginRequest request) {
        Authentication authentication = authenticationManager.authenticate(
                UsernamePasswordAuthenticationToken.unauthenticated(
                        request.email(),
                        request.password()
                )
        );

        JwtToken accessToken = tokenProvider.generate(authentication);
        String refreshToken = UUID.randomUUID().toString();
        redis.opsForValue().set(REFRESH_PREFIX + refreshToken, request.email(), REFRESH_TTL);

        String role = AuthorityUtils.authorityListToSet(authentication.getAuthorities())
                .stream().findFirst()
                .map(r -> r.replace("ROLE_", "").toLowerCase())
                .orElse("");

        long expiration = accessToken.expiration().toEpochMilli();

        return new LoginResponse(accessToken.value(), refreshToken, role, expiration);
    }

    public RefreshResponse refresh(RefreshRequest request) {
        String email = redis.opsForValue().get(REFRESH_PREFIX + request.refreshToken());
        if (email == null) {
            throw new UnauthorizedException("Invalid or expired refresh token");
        }

        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new UnauthorizedException("User not found"));

        Authentication auth = new UsernamePasswordAuthenticationToken(user, null, user.getAuthorities());
        JwtToken newAccessToken = tokenProvider.generate(auth);

        // rotate refresh token
        redis.delete(REFRESH_PREFIX + request.refreshToken());
        String newRefreshToken = UUID.randomUUID().toString();
        redis.opsForValue().set(REFRESH_PREFIX + newRefreshToken, email, REFRESH_TTL);

        long expiration = newAccessToken.expiration().toEpochMilli();
        return new RefreshResponse(newAccessToken.value(), newRefreshToken, expiration);
    }

    public void logout(String accessToken, String refreshToken) {
        tokenProvider.block(accessToken);
        if (refreshToken != null && !refreshToken.isBlank()) {
            redis.delete(REFRESH_PREFIX + refreshToken);
        }
    }
}
