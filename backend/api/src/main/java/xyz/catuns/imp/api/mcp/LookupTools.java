package xyz.catuns.imp.api.mcp;

import lombok.RequiredArgsConstructor;
import org.springframework.ai.tool.annotation.Tool;
import org.springframework.ai.tool.annotation.ToolParam;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Component;
import xyz.catuns.imp.api.client.ClientService;
import xyz.catuns.imp.api.client.dto.ClientResponse;
import xyz.catuns.imp.api.question.QuestionSearchService;
import xyz.catuns.imp.api.question.SessionQuestionService;
import xyz.catuns.imp.api.question.dto.QuestionResponse;
import xyz.catuns.imp.api.question.dto.SessionQuestionResponse;
import xyz.catuns.imp.api.session.InterviewSessionService;
import xyz.catuns.imp.api.session.dto.InterviewSessionResponse;
import xyz.catuns.imp.api.session.entity.SessionStatus;
import xyz.catuns.imp.api.user.UserService;
import xyz.catuns.imp.api.user.dto.UserLookupResponse;
import xyz.catuns.imp.api.user.entity.UserRole;
import xyz.catuns.spring.base.exception.controller.BadRequestException;

import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

/**
 * Read-only MCP tools backing an AI agent's context lookups during a live interview: clients,
 * candidates, sessions, and existing questions. Each method is a thin adapter over the same
 * service layer the REST controllers call — {@code @PreAuthorize} on the delegate enforces
 * ROLE_AI_AGENT exactly as it would for the equivalent REST request, since these tool calls run
 * in-process on the same Authentication that {@code ApiKeyAuthFilter} set for the MCP request.
 */
@Component
@RequiredArgsConstructor
public class LookupTools {

    private static final int RESULT_LIMIT = 20;

    private final ClientService clientService;
    private final UserService userService;
    private final InterviewSessionService interviewSessionService;
    private final QuestionSearchService questionSearchService;
    private final SessionQuestionService sessionQuestionService;

    @Tool(name = "search_clients", description = "Search end clients by name or industry. Returns up to "
            + RESULT_LIMIT + " active clients matching the query. Use this to resolve a client mentioned by "
            + "name to its clientId before creating or searching questions.")
    public List<ClientResponse> searchClients(
            @ToolParam(description = "Free-text search against client name and industry. Blank/omitted returns "
                    + "the most recently active clients.", required = false) String query) {
        Pageable pageable = PageRequest.of(0, RESULT_LIMIT, Sort.by("name").ascending());
        return clientService.list(true, query, pageable).getContent();
    }

    @Tool(name = "search_candidates", description = "Search candidates (interviewees) by name. Returns up to "
            + RESULT_LIMIT + " matches with id, name, and role. Use this to resolve a candidate mentioned by "
            + "name (e.g. \"the candidate Sarah\") to a userId.")
    public List<UserLookupResponse> searchCandidates(
            @ToolParam(description = "Full or partial candidate name, case-insensitive.") String query) {
        return userService.search(query, UserRole.CANDIDATE);
    }

    @Tool(name = "search_sessions", description = "Search interview sessions by candidate name, round, mode, or "
            + "description, optionally filtered by status and a scheduled-date range. Returns up to "
            + RESULT_LIMIT + " sessions with their id, status, schedule, and candidate/client/technology "
            + "context. Use this to find the active session a live interview corresponds to before adding or "
            + "linking questions to it.")
    public List<InterviewSessionResponse> searchSessions(
            @ToolParam(description = "Free-text search against candidate name, round, mode, and description.",
                    required = false) String query,
            @ToolParam(description = "Optional status filter: SCHEDULED, IN_REVIEW, PASSED, REJECTED, NO_SHOW, "
                    + "CANCELLED, or RESCHEDULED.", required = false) String status,
            @ToolParam(description = "Optional inclusive lower bound (ISO-8601 date, e.g. 2026-08-01) on "
                    + "scheduledAt.", required = false) LocalDate scheduledFrom,
            @ToolParam(description = "Optional inclusive upper bound (ISO-8601 date) on scheduledAt.",
                    required = false) LocalDate scheduledTo) {
        Pageable pageable = PageRequest.of(0, RESULT_LIMIT, Sort.by("scheduledAt").descending());
        return interviewSessionService.list(query, parseStatus(status), null, null, scheduledFrom, scheduledTo,
                pageable).getContent();
    }

    @Tool(name = "get_session", description = "Fetch a single interview session by id, including its status, "
            + "schedule, and candidate/client/technology context. Use this to confirm the right session before "
            + "adding or linking questions to it.")
    public InterviewSessionResponse getSession(
            @ToolParam(description = "The session's id, as returned by search_sessions.") UUID sessionId) {
        return interviewSessionService.getById(sessionId);
    }

    @Tool(name = "search_questions", description = "Full-text search the existing question bank, optionally "
            + "scoped to one client, ranked by relevance. Use this before creating a new question to check "
            + "whether an equivalent one already exists and can be linked instead with link_existing_question.")
    public List<QuestionResponse> searchQuestions(
            @ToolParam(description = "Full-text search query, matched against topic and body.") String query,
            @ToolParam(description = "Optional clientId to restrict results to one end client.",
                    required = false) UUID clientId) {
        Pageable pageable = PageRequest.of(0, RESULT_LIMIT);
        return questionSearchService.search(query, clientId, pageable).getContent();
    }

    @Tool(name = "list_session_questions", description = "List all questions already linked to a session, in "
            + "display order. Use this to see what's already captured before adding more questions, and to "
            + "avoid creating duplicates.")
    public List<SessionQuestionResponse> listSessionQuestions(
            @ToolParam(description = "The session's id.") UUID sessionId) {
        return sessionQuestionService.listBySession(sessionId);
    }

    private static SessionStatus parseStatus(String status) {
        if (status == null || status.isBlank()) {
            return null;
        }
        try {
            return SessionStatus.valueOf(status.trim().toUpperCase());
        } catch (IllegalArgumentException e) {
            throw new BadRequestException("Unknown session status: " + status);
        }
    }
}
