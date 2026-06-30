package xyz.catuns.imp.api.question.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

import java.util.UUID;

public record CreateQuestionRequest(
        @NotNull UUID clientId,
        @NotBlank String topic,
        @NotBlank String round,
        @NotBlank String body
) {}
