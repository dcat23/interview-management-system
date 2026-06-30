package xyz.catuns.imp.api.question.dto;

import java.time.Instant;
import java.util.UUID;

public record QuestionResponse(
        UUID id,
        UUID clientId,
        String topic,
        String round,
        String body,
        int version,
        boolean active,
        UUID createdBy,
        UUID updatedBy,
        Instant createdAt,
        Instant updatedAt
) {}
