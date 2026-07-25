package xyz.catuns.imp.api.user.dto;

import java.util.UUID;

public record CandidateResponse(
        UUID id,
        String name
) {
}
