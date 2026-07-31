package xyz.catuns.imp.api.process.dto;

import xyz.catuns.imp.api.process.entity.ProcessStatus;
import xyz.catuns.imp.api.session.dto.InterviewSessionResponse;

import java.time.Instant;
import java.util.List;
import java.util.UUID;

public record InterviewProcessResponse(
        UUID id,
        UUID candidateId,
        String candidateName,
        UUID clientId,
        String clientName,
        UUID marketerId,
        String technology,
        String jobId,
        String description,
        ProcessStatus status,
        Instant startedAt,
        Instant closedAt,
        Instant createdAt,
        Instant updatedAt,
        /** Only populated by GET /processes/:id - null on list responses to avoid an N+1 per row. */
        List<InterviewSessionResponse> sessions
) {
}
