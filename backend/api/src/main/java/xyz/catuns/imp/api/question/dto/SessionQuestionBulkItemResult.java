package xyz.catuns.imp.api.question.dto;

import java.util.UUID;

public record SessionQuestionBulkItemResult(
        int itemIndex,
        Outcome outcome,
        UUID questionId,
        UUID sessionQuestionId,
        String error
) {
    public enum Outcome {
        CREATED, FAILED
    }
}
