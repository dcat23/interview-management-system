package xyz.catuns.imp.api.question.dto;

import jakarta.validation.constraints.NotEmpty;

import java.util.List;

public record CreateSessionQuestionRequest(
        @NotEmpty List<CreateSessionQuestionItem> questions
) {}
