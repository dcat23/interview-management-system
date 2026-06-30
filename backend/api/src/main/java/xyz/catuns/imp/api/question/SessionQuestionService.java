package xyz.catuns.imp.api.question;

import lombok.RequiredArgsConstructor;
import org.springframework.cache.annotation.CacheEvict;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import xyz.catuns.imp.api.config.CacheConfig;
import xyz.catuns.imp.api.question.dto.LinkQuestionRequest;
import xyz.catuns.imp.api.question.dto.SessionQuestionResponse;
import xyz.catuns.imp.api.question.entity.Question;
import xyz.catuns.imp.api.question.entity.SessionQuestion;
import xyz.catuns.imp.api.question.repository.QuestionRepository;
import xyz.catuns.imp.api.question.repository.SessionQuestionRepository;
import xyz.catuns.imp.api.session.repository.InterviewSessionRepository;
import xyz.catuns.imp.api.user.entity.User;
import xyz.catuns.imp.api.user.repository.UserRepository;
import xyz.catuns.spring.base.exception.controller.ConflictException;
import xyz.catuns.spring.base.exception.controller.NotFoundException;

import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class SessionQuestionService {

    private final SessionQuestionRepository sessionQuestionRepository;
    private final InterviewSessionRepository sessionRepository;
    private final QuestionRepository questionRepository;
    private final UserRepository userRepository;

    @Cacheable(value = CacheConfig.QUESTIONS_BY_SESSION, key = "#sessionId")
    public List<SessionQuestionResponse> listBySession(UUID sessionId) {
        sessionRepository.findById(sessionId)
                .orElseThrow(() -> new NotFoundException("Session not found"));
        return sessionQuestionRepository.findBySessionIdOrderByDisplayOrder(sessionId)
                .stream().map(this::toResponse).toList();
    }

    @PreAuthorize("hasRole('ADMIN') or (hasRole('SUPPORTER') and @sessionQuestionService.isAssignedSupporter(#sessionId, authentication.name))")
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
