package xyz.catuns.imp.api.session.dto;

import xyz.catuns.imp.api.session.entity.SessionStatus;

import java.time.Instant;
import java.util.UUID;

public record InterviewSessionResponse(
        UUID id,
        UUID processId,
        UUID supporterId,
        String round,
        String mode,
        int durationMinutes,
        String description,
        SessionStatus status,
        Instant scheduledAt,
        Instant statusChangedAt,
        UUID statusChangedBy,
        Instant createdAt,
        Instant updatedAt
) {
}
