package xyz.catuns.imp.api.session.dto;

import jakarta.validation.constraints.Positive;

import java.time.Instant;
import java.util.UUID;

public record UpdateSessionRequest(
        UUID supporterId,
        String round,
        String mode,
        @Positive Integer durationMinutes,
        String description,
        Instant scheduledAt
) {
}
