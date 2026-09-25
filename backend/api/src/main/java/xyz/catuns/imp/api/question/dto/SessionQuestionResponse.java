package xyz.catuns.imp.api.question.dto;

import java.time.Instant;
import java.util.UUID;

public record SessionQuestionResponse(
        UUID id,
        UUID sessionId,
        UUID questionId,
        int displayOrder,
        String notes,
        Instant createdAt,
        // Joined from the linked question so clients can render the list without a lookup per row.
        String topic,
        String body
) {}
