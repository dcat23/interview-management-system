package xyz.catuns.imp.api.process.dto;

import xyz.catuns.imp.api.process.entity.ProcessStatus;

import java.time.Instant;
import java.util.UUID;

public record InterviewProcessResponse(
        UUID id,
        UUID candidateId,
        UUID clientId,
        UUID marketerId,
        String technology,
        String description,
        ProcessStatus status,
        Instant startedAt,
        Instant closedAt,
        Instant createdAt,
        Instant updatedAt
) {
}
