package xyz.catuns.imp.api.question.dto;

import java.util.UUID;

/**
 * One row of a bulk session-question batch: the {@link CreateQuestionRequest} fields plus the
 * optional displayOrder/notes from {@link LinkQuestionRequest}. Deliberately unvalidated by Bean
 * Validation (no {@code @NotNull}/{@code @NotBlank}) — a malformed item is reported as a per-item
 * FAILED outcome by SessionQuestionService rather than rejecting the whole batch with a 400.
 */
public record CreateSessionQuestionItem(
        UUID clientId,
        String topic,
        String round,
        String body,
        Integer displayOrder,
        String notes
) {}
