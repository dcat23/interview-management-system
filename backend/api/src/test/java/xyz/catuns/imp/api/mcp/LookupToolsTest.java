package xyz.catuns.imp.api.mcp;

import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import xyz.catuns.imp.api.client.ClientService;
import xyz.catuns.imp.api.question.QuestionSearchService;
import xyz.catuns.imp.api.question.SessionQuestionService;
import xyz.catuns.imp.api.session.InterviewSessionService;
import xyz.catuns.imp.api.session.entity.SessionStatus;
import xyz.catuns.imp.api.user.UserService;
import xyz.catuns.imp.api.user.entity.UserRole;

import java.util.List;
import java.util.UUID;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.ArgumentMatchers.isNull;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.verifyNoInteractions;
import static org.mockito.Mockito.verifyNoMoreInteractions;
import static org.mockito.Mockito.when;

/**
 * Proves each {@link LookupTools} method — the six MCP tools that must be classified as
 * read-only (see {@link McpToolConfig}) — calls exactly one read/query method on the service
 * layer and touches no other service, in particular none of the mutating methods
 * {@code SessionQuestionService.link}/{@code bulkCreateAndLink} that back the write tools in
 * {@link QuestionWriteTools}.
 */
@ExtendWith(MockitoExtension.class)
class LookupToolsTest {

    @Mock ClientService clientService;
    @Mock UserService userService;
    @Mock InterviewSessionService interviewSessionService;
    @Mock QuestionSearchService questionSearchService;
    @Mock SessionQuestionService sessionQuestionService;

    @InjectMocks LookupTools lookupTools;

    @Test
    void searchClients_onlyReadsClientService() {
        when(clientService.list(eq(true), any(), any())).thenReturn(Page.empty());

        lookupTools.searchClients("acme");

        verify(clientService).list(eq(true), eq("acme"), any(Pageable.class));
        verifyNoMoreInteractions(clientService);
        verifyNoInteractions(userService, interviewSessionService, questionSearchService, sessionQuestionService);
    }

    @Test
    void searchCandidates_onlyReadsUserService() {
        when(userService.search(any(), eq(UserRole.CANDIDATE))).thenReturn(List.of());

        lookupTools.searchCandidates("sarah");

        verify(userService).search(eq("sarah"), eq(UserRole.CANDIDATE));
        verifyNoMoreInteractions(userService);
        verifyNoInteractions(clientService, interviewSessionService, questionSearchService, sessionQuestionService);
    }

    @Test
    void searchSessions_onlyReadsInterviewSessionService() {
        UUID clientId = UUID.randomUUID();
        when(interviewSessionService.list(any(), any(), any(), any(), any(), any(), any(), any(), any()))
                .thenReturn(Page.empty());

        lookupTools.searchSessions("sarah", "SCHEDULED", clientId, "technical", null, null);

        verify(interviewSessionService).list(eq("sarah"), eq(SessionStatus.SCHEDULED), isNull(), isNull(),
                eq(clientId), eq("technical"), isNull(), isNull(), any(Pageable.class));
        verifyNoMoreInteractions(interviewSessionService);
        verifyNoInteractions(clientService, userService, questionSearchService, sessionQuestionService);
    }

    @Test
    void getSession_onlyReadsInterviewSessionService() {
        UUID sessionId = UUID.randomUUID();

        lookupTools.getSession(sessionId);

        verify(interviewSessionService).getById(sessionId);
        verifyNoMoreInteractions(interviewSessionService);
        verifyNoInteractions(clientService, userService, questionSearchService, sessionQuestionService);
    }

    @Test
    void searchQuestions_onlyReadsQuestionSearchService() {
        UUID clientId = UUID.randomUUID();
        when(questionSearchService.search(any(), any(), any())).thenReturn(Page.empty());

        lookupTools.searchQuestions("binary search", clientId);

        verify(questionSearchService).search(eq("binary search"), eq(clientId), any(Pageable.class));
        verifyNoMoreInteractions(questionSearchService);
        verifyNoInteractions(clientService, userService, interviewSessionService, sessionQuestionService);
    }

    @Test
    void listSessionQuestions_onlyReadsSessionQuestionService() {
        UUID sessionId = UUID.randomUUID();
        when(sessionQuestionService.listBySession(sessionId)).thenReturn(List.of());

        lookupTools.listSessionQuestions(sessionId);

        // listBySession only — never link/bulkCreateAndLink/unlink, the mutating methods on the
        // same service that back add_questions_to_session / link_existing_question.
        verify(sessionQuestionService).listBySession(sessionId);
        verifyNoMoreInteractions(sessionQuestionService);
        verifyNoInteractions(clientService, userService, interviewSessionService, questionSearchService);
    }
}
