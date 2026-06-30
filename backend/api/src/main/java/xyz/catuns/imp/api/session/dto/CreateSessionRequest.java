package xyz.catuns.imp.api.session.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;

import java.time.Instant;
import java.util.UUID;

public record CreateSessionRequest(
        @NotNull UUID supporterId,
        @NotBlank String round,
        @NotBlank String mode,
        @Positive int durationMinutes,
        String description,
        @NotNull Instant scheduledAt
) {
}
