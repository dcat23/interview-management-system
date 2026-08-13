package xyz.catuns.imp.api.mcp;

import lombok.RequiredArgsConstructor;
import org.springframework.ai.tool.annotation.Tool;
import org.springframework.ai.tool.annotation.ToolParam;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Component;
import xyz.catuns.imp.api.question.SessionQuestionService;
import xyz.catuns.imp.api.question.dto.CreateSessionQuestionItem;
import xyz.catuns.imp.api.question.dto.CreateSessionQuestionRequest;
import xyz.catuns.imp.api.question.dto.LinkQuestionRequest;
import xyz.catuns.imp.api.question.dto.SessionQuestionBulkSummaryResponse;
import xyz.catuns.imp.api.question.dto.SessionQuestionResponse;

import java.util.List;
import java.util.UUID;

/**
 * Write MCP tools for capturing interview questions live: create-and-link a batch of new
 * questions, or link a question that already exists in the bank. Both delegate to
 * {@link SessionQuestionService}, so {@code @PreAuthorize} (ROLE_AI_AGENT, unscoped to the issuing
 * supporter's own assignments — see the authentication story) and the per-item partial-success
 * behavior are identical to the REST {@code POST /sessions/{sessionId}/questions[/bulk]}
 * endpoints. Delete/unlink, question update, status transitions, feedback, and user/client
 * mutation are deliberately not exposed here.
 */
@Component
@RequiredArgsConstructor
public class QuestionWriteTools {

    private final SessionQuestionService sessionQuestionService;

    @Tool(name = "add_questions_to_session", description = "Create one or more new questions and link them to "
            + "an interview session in a single call. Each item is created and linked independently: one "
            + "malformed item (missing fields, unknown clientId) is reported as a FAILED result without "
            + "discarding the rest of the batch. Call search_questions first to avoid creating a duplicate of "
            + "a question that already exists — link it with link_existing_question instead.")
    public SessionQuestionBulkSummaryResponse addQuestionsToSession(
            @ToolParam(description = "The session's id to link the new questions to.") UUID sessionId,
            @ToolParam(description = "The questions to create and link. Each item needs clientId, topic, round, "
                    + "and body; displayOrder and notes are optional.")
            List<CreateSessionQuestionItem> questions) {
        return sessionQuestionService.bulkCreateAndLink(
                sessionId, new CreateSessionQuestionRequest(questions), currentAuthentication());
    }

    @Tool(name = "link_existing_question", description = "Link a question that already exists in the question "
            + "bank to a session, without creating a new one. Use this after search_questions finds a matching "
            + "question, to avoid creating a duplicate.")
    public SessionQuestionResponse linkExistingQuestion(
            @ToolParam(description = "The session's id.") UUID sessionId,
            @ToolParam(description = "The id of the existing, active question to link, as returned by "
                    + "search_questions.") UUID questionId,
            @ToolParam(description = "Optional display order within the session's question list.",
                    required = false) Integer displayOrder,
            @ToolParam(description = "Optional free-text note about this question in the context of the "
                    + "session.", required = false) String notes) {
        return sessionQuestionService.link(sessionId, new LinkQuestionRequest(questionId, displayOrder, notes));
    }

    private static Authentication currentAuthentication() {
        return SecurityContextHolder.getContext().getAuthentication();
    }
}
