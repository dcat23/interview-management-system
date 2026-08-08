package xyz.catuns.imp.api.feedback.dto;

public record UpdateFeedbackRequest(
        String body,
        Boolean isSubmitted
) {
}
