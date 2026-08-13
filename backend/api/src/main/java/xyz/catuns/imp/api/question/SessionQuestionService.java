package xyz.catuns.imp.api.question;

import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.cache.annotation.CacheEvict;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.context.annotation.Lazy;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Propagation;
import org.springframework.transaction.annotation.Transactional;
import xyz.catuns.imp.api.client.repository.ClientRepository;
import xyz.catuns.imp.api.config.CacheConfig;
import xyz.catuns.imp.api.question.dto.CreateQuestionRequest;
import xyz.catuns.imp.api.question.dto.CreateSessionQuestionItem;
import xyz.catuns.imp.api.question.dto.CreateSessionQuestionRequest;
import xyz.catuns.imp.api.question.dto.LinkQuestionRequest;
import xyz.catuns.imp.api.question.dto.SessionQuestionBulkItemResult;
import xyz.catuns.imp.api.question.dto.SessionQuestionBulkSummaryResponse;
import xyz.catuns.imp.api.question.dto.SessionQuestionResponse;
import xyz.catuns.imp.api.question.entity.Question;
import xyz.catuns.imp.api.question.entity.SessionQuestion;
import xyz.catuns.imp.api.question.mapper.QuestionMapper;
import xyz.catuns.imp.api.question.repository.QuestionRepository;
import xyz.catuns.imp.api.question.repository.SessionQuestionRepository;
import xyz.catuns.imp.api.session.repository.InterviewSessionRepository;
import xyz.catuns.imp.api.user.entity.User;
import xyz.catuns.imp.api.user.repository.UserRepository;
import xyz.catuns.spring.base.exception.controller.ConflictException;
import xyz.catuns.spring.base.exception.controller.NotFoundException;

import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class SessionQuestionService {

    private final SessionQuestionRepository sessionQuestionRepository;
    private final InterviewSessionRepository sessionRepository;
    private final QuestionRepository questionRepository;
    private final ClientRepository clientRepository;
    private final UserRepository userRepository;
    private final QuestionMapper questionMapper;

    // Self-injection via @Lazy so @Transactional(REQUIRES_NEW) on createAndLinkItem is honoured
    // when called from within this class, matching the pattern in ScheduleImportService.
    @Autowired
    @Lazy
    private SessionQuestionService self;

    // No @PreAuthorize before: unrestricted to any authenticated principal via the global
    // anyRequest().authenticated() rule, which already includes ROLE_AI_AGENT. Made explicit here
    // so that intent isn't lost if this method is ever tightened later.
    @PreAuthorize("isAuthenticated()")
    @Cacheable(value = CacheConfig.QUESTIONS_BY_SESSION, key = "#sessionId")
    public List<SessionQuestionResponse> listBySession(UUID sessionId) {
        sessionRepository.findById(sessionId)
                .orElseThrow(() -> new NotFoundException("Session not found"));
        return sessionQuestionRepository.findBySessionIdOrderByDisplayOrder(sessionId)
                .stream().map(this::toResponse).toList();
    }

    // ROLE_AI_AGENT is unscoped here, unlike SUPPORTER — deliberately not inheriting the
    // isAssignedSupporter restriction, per the agent-writes design decision.
    @PreAuthorize("hasRole('ADMIN') or hasRole('AI_AGENT') " +
            "or (hasRole('SUPPORTER') and @sessionQuestionService.isAssignedSupporter(#sessionId, authentication.name))")
    @Transactional
    @CacheEvict(value = CacheConfig.QUESTIONS_BY_SESSION, key = "#sessionId")
    public SessionQuestionResponse link(UUID sessionId, LinkQuestionRequest request) {
        sessionRepository.findById(sessionId)
                .orElseThrow(() -> new NotFoundException("Session not found"));
        Question question = questionRepository.findById(request.questionId())
                .filter(Question::isActive)
                .orElseThrow(() -> new NotFoundException("Question not found or inactive"));

        if (sessionQuestionRepository.existsBySessionIdAndQuestionId(sessionId, question.getId())) {
            throw new ConflictException("Question already linked to this session");
        }

        SessionQuestion sq = new SessionQuestion();
        sq.setSessionId(sessionId);
        sq.setQuestionId(question.getId());
        sq.setDisplayOrder(request.displayOrder() != null ? request.displayOrder() : 0);
        sq.setNotes(request.notes());
        return toResponse(sessionQuestionRepository.save(sq));
    }

    // Same authorization shape as link(): ROLE_AI_AGENT is unscoped, SUPPORTER stays restricted to
    // sessions assigned to them. Each item is created and linked in its own REQUIRES_NEW
    // transaction (see createAndLinkItem) so one bad item — invalid clientId, failed validation —
    // doesn't roll back the rest of the batch, mirroring ScheduleImportService's per-row pattern.
    @PreAuthorize("hasRole('ADMIN') or hasRole('AI_AGENT') " +
            "or (hasRole('SUPPORTER') and @sessionQuestionService.isAssignedSupporter(#sessionId, authentication.name))")
    @CacheEvict(value = CacheConfig.QUESTIONS_BY_SESSION, key = "#sessionId")
    public SessionQuestionBulkSummaryResponse bulkCreateAndLink(UUID sessionId, CreateSessionQuestionRequest request,
                                                                 Authentication authentication) {
        sessionRepository.findById(sessionId)
                .orElseThrow(() -> new NotFoundException("Session not found"));
        UUID actorId = resolveUserId(authentication.getName());

        List<CreateSessionQuestionItem> items = request.questions();
        List<SessionQuestionBulkItemResult> results = new ArrayList<>(items.size());
        for (int i = 0; i < items.size(); i++) {
            results.add(processItem(sessionId, i, items.get(i), actorId));
        }
        return SessionQuestionBulkSummaryResponse.from(results);
    }

    private SessionQuestionBulkItemResult processItem(UUID sessionId, int itemIndex, CreateSessionQuestionItem item, UUID actorId) {
        try {
            validateItem(item);
            ItemWriteResult written = self.createAndLinkItem(sessionId, item, actorId);
            return new SessionQuestionBulkItemResult(itemIndex, SessionQuestionBulkItemResult.Outcome.CREATED,
                    written.questionId(), written.sessionQuestionId(), null);
        } catch (Exception e) {
            return new SessionQuestionBulkItemResult(itemIndex, SessionQuestionBulkItemResult.Outcome.FAILED,
                    null, null, e.getMessage());
        }
    }

    // Creates the Question and links it to the session as one unit of work, independent of the
    // batch's outer (read-only) transaction. Bypasses QuestionService.create, which is
    // ADMIN-only, since this write path is reached by AI_AGENT and assignment-scoped SUPPORTER too.
    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public ItemWriteResult createAndLinkItem(UUID sessionId, CreateSessionQuestionItem item, UUID actorId) {
        clientRepository.findById(item.clientId())
                .orElseThrow(() -> new NotFoundException("Client not found: " + item.clientId()));

        Question question = questionMapper.toEntity(
                new CreateQuestionRequest(item.clientId(), item.topic(), item.round(), item.body()));
        question.setCreatedBy(actorId);
        question = questionRepository.save(question);

        SessionQuestion sq = new SessionQuestion();
        sq.setSessionId(sessionId);
        sq.setQuestionId(question.getId());
        sq.setDisplayOrder(item.displayOrder() != null ? item.displayOrder() : 0);
        sq.setNotes(item.notes());
        sq = sessionQuestionRepository.save(sq);

        return new ItemWriteResult(question.getId(), sq.getId());
    }

    private static void validateItem(CreateSessionQuestionItem item) {
        if (item.clientId() == null) {
            throw new IllegalArgumentException("clientId is required");
        }
        if (isBlank(item.topic()) || isBlank(item.round()) || isBlank(item.body())) {
            throw new IllegalArgumentException("topic, round, and body are required");
        }
    }

    private static boolean isBlank(String s) {
        return s == null || s.isBlank();
    }

    private record ItemWriteResult(UUID questionId, UUID sessionQuestionId) {
    }

    @PreAuthorize("hasRole('ADMIN') or (hasRole('SUPPORTER') and @sessionQuestionService.isAssignedSupporter(#sessionId, authentication.name))")
    @Transactional
    @CacheEvict(value = CacheConfig.QUESTIONS_BY_SESSION, key = "#sessionId")
    public void unlink(UUID sessionId, UUID questionId) {
        SessionQuestion sq = sessionQuestionRepository.findBySessionIdAndQuestionId(sessionId, questionId)
                .orElseThrow(() -> new NotFoundException("Link not found"));
        sessionQuestionRepository.delete(sq);
    }

    public boolean isAssignedSupporter(UUID sessionId, String email) {
        UUID userId = resolveUserId(email);
        return sessionRepository.findById(sessionId)
                .map(s -> userId.equals(s.getSupporterId()))
                .orElse(false);
    }

    private SessionQuestionResponse toResponse(SessionQuestion sq) {
        return new SessionQuestionResponse(
                sq.getId(), sq.getSessionId(), sq.getQuestionId(),
                sq.getDisplayOrder(), sq.getNotes(), sq.getCreatedAt());
    }

    private UUID resolveUserId(String email) {
        return userRepository.findByEmail(email)
                .map(User::getId)
                .orElseThrow(() -> new NotFoundException("User not found"));
    }
}
