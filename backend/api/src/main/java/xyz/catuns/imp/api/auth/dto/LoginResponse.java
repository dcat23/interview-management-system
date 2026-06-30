package xyz.catuns.imp.api.auth.dto;

public record LoginResponse(
        String accessToken,
        String refreshToken,
        String role,
        long expiresIn
) {
}
