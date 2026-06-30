package xyz.catuns.imp.api.user.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import xyz.catuns.imp.api.user.entity.UserRole;

public record CreateUserRequest(
        @NotBlank String name,
        @NotBlank @Email String email,
        @NotBlank @Size(min = 12, message = "Password must be at least 12 characters") String password,
        @NotNull UserRole role
) {
}
