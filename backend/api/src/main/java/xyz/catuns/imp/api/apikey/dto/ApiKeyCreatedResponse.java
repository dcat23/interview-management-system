package xyz.catuns.imp.api.apikey.dto;

import java.time.Instant;
import java.util.UUID;

/**
 * Returned exactly once, from the create endpoint. {@code key} is the raw, plaintext API key, for
 * the {@code X-API-Key} REST/programmatic path. {@code bearerToken} is a JWT wrapping the same
 * key's id, for the {@code Authorization: Bearer} path MCP hosted connectors (Claude, Perplexity)
 * expect. Neither is stored — both are derivable again only by revoking this key and issuing a
 * new one.
 */
public record ApiKeyCreatedResponse(
        UUID id,
        String name,
        String keyPrefix,
        String key,
        String bearerToken,
        Instant expiresAt,
        Instant createdAt
) {
}
