package xyz.catuns.imp.api.auth.dto;

import jakarta.validation.constraints.Email;

// Self-service update — intentionally excludes role/active. Changing those
// requires an admin via PATCH /users/{id}, so a candidate can't promote
// themselves through their own profile edit.
public record UpdateMeRequest(
        String name,
        @Email String email
) {
}
