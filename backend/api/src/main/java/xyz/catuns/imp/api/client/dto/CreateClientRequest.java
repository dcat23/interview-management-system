package xyz.catuns.imp.api.client.dto;

import jakarta.validation.constraints.NotBlank;

public record CreateClientRequest(
        @NotBlank String name,
        String industry
) {
}
