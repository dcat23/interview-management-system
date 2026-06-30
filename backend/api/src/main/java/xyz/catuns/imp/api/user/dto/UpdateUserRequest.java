package xyz.catuns.imp.api.user.dto;

import jakarta.validation.constraints.Email;
import xyz.catuns.imp.api.user.entity.UserRole;

public record UpdateUserRequest(
        String name,
        @Email String email,
        UserRole role,
        Boolean active
) {
}
