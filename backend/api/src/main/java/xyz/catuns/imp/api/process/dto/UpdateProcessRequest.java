package xyz.catuns.imp.api.process.dto;

import xyz.catuns.imp.api.process.entity.ProcessStatus;

import java.time.Instant;

public record UpdateProcessRequest(
        String technology,
        String description,
        ProcessStatus status,
        Instant closedAt
) {
}
