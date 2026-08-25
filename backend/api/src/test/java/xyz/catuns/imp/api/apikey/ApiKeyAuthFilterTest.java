package xyz.catuns.imp.api.apikey;

import jakarta.servlet.FilterChain;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.mock.web.MockHttpServletRequest;
import org.springframework.mock.web.MockHttpServletResponse;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import xyz.catuns.imp.api.apikey.entity.ApiKey;
import xyz.catuns.imp.api.apikey.repository.ApiKeyRepository;
import xyz.catuns.imp.api.user.entity.User;
import xyz.catuns.imp.api.user.repository.UserRepository;

import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.Optional;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.times;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class ApiKeyAuthFilterTest {

    @Mock ApiKeyRepository apiKeyRepository;
    @Mock UserRepository userRepository;
    @Mock FilterChain filterChain;

    @InjectMocks ApiKeyAuthFilter filter;

    @AfterEach
    void clearContext() {
        SecurityContextHolder.clearContext();
    }

    @Test
    void missingHeaderPassesThroughWithoutTouchingRepositories() throws Exception {
        MockHttpServletRequest request = new MockHttpServletRequest();
        MockHttpServletResponse response = new MockHttpServletResponse();

        filter.doFilter(request, response, filterChain);

        verify(filterChain, times(1)).doFilter(request, response);
        verify(apiKeyRepository, never()).findByKeyHash(any());
        assertThat(SecurityContextHolder.getContext().getAuthentication()).isNull();
    }

    @Test
    void validKeySetsAiAgentAuthenticationAndTouchesLastUsedAt() throws Exception {
        String rawKey = ApiKeyGenerator.generateRawKey();
        UUID ownerId = UUID.randomUUID();

        ApiKey apiKey = new ApiKey();
        apiKey.setOwnerId(ownerId);
        apiKey.setRevoked(false);
        apiKey.setExpiresAt(Instant.now().plus(1, ChronoUnit.DAYS));

        User owner = new User();
        owner.setId(ownerId);
        owner.setEmail("supporter@example.com");

        when(apiKeyRepository.findByKeyHash(ApiKeyGenerator.hash(rawKey))).thenReturn(Optional.of(apiKey));
        when(userRepository.findById(ownerId)).thenReturn(Optional.of(owner));

        MockHttpServletRequest request = new MockHttpServletRequest();
        request.addHeader(ApiKeyAuthFilter.API_KEY_HEADER, rawKey);
        MockHttpServletResponse response = new MockHttpServletResponse();

        filter.doFilter(request, response, filterChain);

        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        assertThat(authentication).isNotNull();
        assertThat(authentication.getName()).isEqualTo("supporter@example.com");
        assertThat(authentication.getAuthorities())
                .extracting(Object::toString)
                .containsExactly(ApiKeyAuthFilter.AI_AGENT_AUTHORITY);

        verify(apiKeyRepository, times(1)).save(apiKey);
        assertThat(apiKey.getLastUsedAt()).isNotNull();
        verify(filterChain, times(1)).doFilter(request, response);
    }

    @Test
    void unknownKeyIsRejected() {
        MockHttpServletRequest request = new MockHttpServletRequest();
        request.addHeader(ApiKeyAuthFilter.API_KEY_HEADER, "aik_doesnotexist");
        MockHttpServletResponse response = new MockHttpServletResponse();

        when(apiKeyRepository.findByKeyHash(any())).thenReturn(Optional.empty());

        assertThatThrownBy(() -> filter.doFilter(request, response, filterChain))
                .isInstanceOf(BadCredentialsException.class);
        assertThat(SecurityContextHolder.getContext().getAuthentication()).isNull();
    }

    @Test
    void revokedKeyIsRejected() {
        String rawKey = ApiKeyGenerator.generateRawKey();
        ApiKey apiKey = new ApiKey();
        apiKey.setRevoked(true);
        apiKey.setExpiresAt(Instant.now().plus(1, ChronoUnit.DAYS));

        when(apiKeyRepository.findByKeyHash(ApiKeyGenerator.hash(rawKey))).thenReturn(Optional.of(apiKey));

        MockHttpServletRequest request = new MockHttpServletRequest();
        request.addHeader(ApiKeyAuthFilter.API_KEY_HEADER, rawKey);
        MockHttpServletResponse response = new MockHttpServletResponse();

        assertThatThrownBy(() -> filter.doFilter(request, response, filterChain))
                .isInstanceOf(BadCredentialsException.class);
        verify(apiKeyRepository, never()).save(any());
    }

    @Test
    void expiredKeyIsRejected() {
        String rawKey = ApiKeyGenerator.generateRawKey();
        ApiKey apiKey = new ApiKey();
        apiKey.setRevoked(false);
        apiKey.setExpiresAt(Instant.now().minus(1, ChronoUnit.DAYS));

        when(apiKeyRepository.findByKeyHash(ApiKeyGenerator.hash(rawKey))).thenReturn(Optional.of(apiKey));

        MockHttpServletRequest request = new MockHttpServletRequest();
        request.addHeader(ApiKeyAuthFilter.API_KEY_HEADER, rawKey);
        MockHttpServletResponse response = new MockHttpServletResponse();

        assertThatThrownBy(() -> filter.doFilter(request, response, filterChain))
                .isInstanceOf(BadCredentialsException.class);
        verify(apiKeyRepository, never()).save(any());
    }
}
