package xyz.catuns.imp.api.feedback.dto;

import jakarta.validation.constraints.NotBlank;

public record CreateFeedbackRequest(
        @NotBlank String body
) {
}
