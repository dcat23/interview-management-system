package xyz.catuns.imp.api.process.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

import java.util.UUID;

public record CreateProcessRequest(
        @NotNull UUID candidateId,
        @NotNull UUID clientId,
        @NotNull UUID marketerId,
        @NotBlank String technology,
        String description
) {
}
