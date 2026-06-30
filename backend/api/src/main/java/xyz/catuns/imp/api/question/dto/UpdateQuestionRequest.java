package xyz.catuns.imp.api.question.dto;

public record UpdateQuestionRequest(
        String topic,
        String round,
        String body
) {}
