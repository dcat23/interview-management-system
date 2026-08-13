package xyz.catuns.imp.api.user.dto;

import xyz.catuns.imp.api.user.entity.UserRole;

import java.util.UUID;

/**
 * Minimal, low-exposure projection of a user for name-search resolution (e.g. an AI agent
 * looking up a candidate or supporter by name). Deliberately excludes email, active status,
 * and any other field not needed to disambiguate a name match.
 */
public record UserLookupResponse(
        UUID id,
        String name,
        UserRole role
) {
}
