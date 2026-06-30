package xyz.catuns.imp.api.user.dto;

import xyz.catuns.imp.api.user.entity.UserRole;

import java.time.Instant;
import java.util.UUID;

public record UserResponse(
        UUID id,
        String name,
        String email,
        UserRole role,
        boolean active,
        Instant createdAt
) {
}
