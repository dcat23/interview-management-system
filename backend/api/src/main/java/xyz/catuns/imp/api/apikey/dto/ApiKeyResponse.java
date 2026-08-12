package xyz.catuns.imp.api.apikey.dto;

import xyz.catuns.imp.api.apikey.entity.ApiKeyScope;

import java.time.Instant;
import java.util.UUID;

public record ApiKeyResponse(
        UUID id,
        String name,
        String keyPrefix,
        ApiKeyScope scope,
        boolean revoked,
        Instant revokedAt,
        Instant expiresAt,
        Instant lastUsedAt,
        Instant createdAt
) {
}
