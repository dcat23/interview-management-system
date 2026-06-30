package xyz.catuns.imp.api.client.dto;

import java.time.Instant;
import java.util.UUID;

public record ClientResponse(
        UUID id,
        String name,
        String industry,
        boolean active,
        Instant createdAt
) {
}
