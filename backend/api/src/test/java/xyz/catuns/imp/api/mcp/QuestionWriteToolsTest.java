package xyz.catuns.imp.api.mcp;

import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import xyz.catuns.imp.api.question.SessionQuestionService;
import xyz.catuns.imp.api.question.dto.CreateSessionQuestionItem;
import xyz.catuns.imp.api.question.dto.CreateSessionQuestionRequest;
import xyz.catuns.imp.api.question.dto.LinkQuestionRequest;
import xyz.catuns.imp.api.question.dto.SessionQuestionBulkSummaryResponse;
import xyz.catuns.imp.api.question.dto.SessionQuestionResponse;

import java.time.Instant;
import java.util.List;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.verifyNoMoreInteractions;
import static org.mockito.Mockito.when;

/**
 * Proves the two MCP tools that must remain write-gated (see {@link McpToolConfig}) actually
 * delegate to {@link SessionQuestionService}'s mutating methods — {@code bulkCreateAndLink} and
 * {@code link} — with the request built from the tool arguments, unchanged from what the REST
 * {@code POST /sessions/{sessionId}/questions[/bulk]} endpoints do.
 */
@ExtendWith(MockitoExtension.class)
class QuestionWriteToolsTest {

    @Mock SessionQuestionService sessionQuestionService;

    @InjectMocks QuestionWriteTools questionWriteTools;

    @Test
    void addQuestionsToSession_createsAndLinksViaBulkCreateAndLink() {
        UUID sessionId = UUID.randomUUID();
        List<CreateSessionQuestionItem> items = List.of(
                new CreateSessionQuestionItem(UUID.randomUUID(), "Arrays", "technical", "Reverse an array", null, null));
        SessionQuestionBulkSummaryResponse expected = new SessionQuestionBulkSummaryResponse(1, 1, 0, List.of());
        when(sessionQuestionService.bulkCreateAndLink(eq(sessionId), any(CreateSessionQuestionRequest.class), any()))
                .thenReturn(expected);

        SessionQuestionBulkSummaryResponse actual = questionWriteTools.addQuestionsToSession(sessionId, items);

        assertThat(actual).isSameAs(expected);
        verify(sessionQuestionService).bulkCreateAndLink(eq(sessionId),
                eq(new CreateSessionQuestionRequest(items)), any());
        verifyNoMoreInteractions(sessionQuestionService);
    }

    @Test
    void linkExistingQuestion_linksViaLink() {
        UUID sessionId = UUID.randomUUID();
        UUID questionId = UUID.randomUUID();
        SessionQuestionResponse expected = new SessionQuestionResponse(UUID.randomUUID(), sessionId, questionId, 2,
                "asked as a follow-up", Instant.now());
        when(sessionQuestionService.link(eq(sessionId), any(LinkQuestionRequest.class))).thenReturn(expected);

        SessionQuestionResponse actual = questionWriteTools.linkExistingQuestion(sessionId, questionId, 2,
                "asked as a follow-up");

        assertThat(actual).isSameAs(expected);
        verify(sessionQuestionService).link(sessionId, new LinkQuestionRequest(questionId, 2, "asked as a follow-up"));
        verifyNoMoreInteractions(sessionQuestionService);
    }
}
