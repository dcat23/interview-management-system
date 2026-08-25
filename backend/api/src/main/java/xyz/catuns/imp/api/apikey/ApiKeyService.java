package xyz.catuns.imp.api.apikey;

import lombok.RequiredArgsConstructor;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import xyz.catuns.imp.api.apikey.dto.ApiKeyCreatedResponse;
import xyz.catuns.imp.api.apikey.dto.ApiKeyResponse;
import xyz.catuns.imp.api.apikey.dto.CreateApiKeyRequest;
import xyz.catuns.imp.api.apikey.entity.ApiKey;
import xyz.catuns.imp.api.apikey.entity.ApiKeyScope;
import xyz.catuns.imp.api.apikey.repository.ApiKeyRepository;
import xyz.catuns.imp.api.user.entity.User;
import xyz.catuns.imp.api.user.repository.UserRepository;
import xyz.catuns.spring.base.exception.controller.NotFoundException;

import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class ApiKeyService {

    private static final int DEFAULT_EXPIRES_IN_DAYS = 90;

    private final ApiKeyRepository apiKeyRepository;
    private final UserRepository userRepository;
    private final ApiKeyTokenProvider apiKeyTokenProvider;

    @PreAuthorize("hasAnyRole('ADMIN','SUPPORTER')")
    @Transactional
    public ApiKeyCreatedResponse create(CreateApiKeyRequest request, Authentication authentication) {
        int expiresInDays = request.expiresInDays() != null ? request.expiresInDays() : DEFAULT_EXPIRES_IN_DAYS;
        UUID ownerId = resolveUserId(authentication.getName());

        String rawKey = ApiKeyGenerator.generateRawKey();

        ApiKey apiKey = new ApiKey();
        apiKey.setOwnerId(ownerId);
        apiKey.setName(request.name());
        apiKey.setKeyPrefix(ApiKeyGenerator.prefix(rawKey));
        apiKey.setKeyHash(ApiKeyGenerator.hash(rawKey));
        apiKey.setScope(ApiKeyScope.AI_AGENT);
        apiKey.setExpiresAt(Instant.now().plus(expiresInDays, ChronoUnit.DAYS));
        apiKey = apiKeyRepository.save(apiKey);

        // Bearer-token twin of the raw key, for MCP hosted connectors — see ApiKeyTokenProvider.
        String bearerToken = apiKeyTokenProvider.generate(apiKey).value();

        return new ApiKeyCreatedResponse(apiKey.getId(), apiKey.getName(), apiKey.getKeyPrefix(),
                rawKey, bearerToken, apiKey.getExpiresAt(), apiKey.getCreatedAt());
    }

    @PreAuthorize("hasAnyRole('ADMIN','SUPPORTER')")
    public List<ApiKeyResponse> list(Authentication authentication) {
        UUID ownerId = resolveUserId(authentication.getName());
        return apiKeyRepository.findByOwnerIdOrderByCreatedAtDesc(ownerId).stream()
                .map(this::toResponse).toList();
    }

    @PreAuthorize("hasRole('ADMIN') or @apiKeyService.isOwner(#id, authentication.name)")
    @Transactional
    public void revoke(UUID id) {
        ApiKey apiKey = apiKeyRepository.findById(id)
                .orElseThrow(() -> new NotFoundException("API key not found"));
        apiKey.setRevoked(true);
        apiKey.setRevokedAt(Instant.now());
        apiKeyRepository.save(apiKey);
    }

    public boolean isOwner(UUID id, String email) {
        UUID userId = resolveUserId(email);
        return apiKeyRepository.findById(id)
                .map(k -> userId.equals(k.getOwnerId()))
                .orElse(false);
    }

    private ApiKeyResponse toResponse(ApiKey apiKey) {
        return new ApiKeyResponse(apiKey.getId(), apiKey.getName(), apiKey.getKeyPrefix(), apiKey.getScope(),
                apiKey.isRevoked(), apiKey.getRevokedAt(), apiKey.getExpiresAt(), apiKey.getLastUsedAt(),
                apiKey.getCreatedAt());
    }

    private UUID resolveUserId(String email) {
        return userRepository.findByEmail(email)
                .map(User::getId)
                .orElseThrow(() -> new NotFoundException("User not found"));
    }
}
