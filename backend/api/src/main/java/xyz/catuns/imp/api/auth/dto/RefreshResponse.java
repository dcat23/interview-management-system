package xyz.catuns.imp.api.auth.dto;

public record RefreshResponse(
        String accessToken,
        String refreshToken,
        long expiration
) {
}
