package xyz.catuns.imp.api.apikey.dto;

import java.time.Instant;
import java.util.UUID;

/**
 * Returned exactly once, from the create endpoint. {@code key} is the raw, plaintext API key —
 * it is never stored and can never be retrieved again after this response.
 */
public record ApiKeyCreatedResponse(
        UUID id,
        String name,
        String keyPrefix,
        String key,
        Instant expiresAt,
        Instant createdAt
) {
}
