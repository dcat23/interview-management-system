package xyz.catuns.imp.api.client.dto;

public record UpdateClientRequest(
        String name,
        String industry,
        Boolean active
) {
}
