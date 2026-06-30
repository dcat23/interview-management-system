package xyz.catuns.imp.api.question.dto;

import jakarta.validation.constraints.NotNull;

import java.util.UUID;

public record LinkQuestionRequest(
        @NotNull UUID questionId,
        Integer displayOrder,
        String notes
) {}
