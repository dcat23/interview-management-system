package xyz.catuns.imp.api.apikey.dto;

import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;

public record CreateApiKeyRequest(
        @NotBlank String name,
        @Min(1) @Max(180) Integer expiresInDays
) {
}
