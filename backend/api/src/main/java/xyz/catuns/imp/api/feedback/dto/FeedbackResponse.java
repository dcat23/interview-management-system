package xyz.catuns.imp.api.feedback.dto;

import java.time.Instant;
import java.util.UUID;

public record FeedbackResponse(
        UUID id,
        UUID sessionId,
        UUID supporterId,
        String body,
        boolean isSubmitted,
        Instant submittedAt,
        Instant updatedAt
) {
}
