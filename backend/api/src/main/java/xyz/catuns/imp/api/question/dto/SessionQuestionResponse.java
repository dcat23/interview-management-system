package xyz.catuns.imp.api.question.dto;

import java.time.Instant;
import java.util.UUID;

public record SessionQuestionResponse(
        UUID id,
        UUID sessionId,
        UUID questionId,
        int displayOrder,
        String notes,
        Instant createdAt
) {}
