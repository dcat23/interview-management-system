package xyz.catuns.imp.api.feedback;

import lombok.RequiredArgsConstructor;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import xyz.catuns.imp.api.feedback.dto.CreateFeedbackRequest;
import xyz.catuns.imp.api.feedback.dto.FeedbackResponse;
import xyz.catuns.imp.api.feedback.dto.UpdateFeedbackRequest;
import xyz.catuns.imp.api.feedback.entity.Feedback;
import xyz.catuns.imp.api.feedback.mapper.FeedbackMapper;
import xyz.catuns.imp.api.feedback.repository.FeedbackRepository;
import xyz.catuns.imp.api.session.entity.InterviewSession;
import xyz.catuns.imp.api.session.repository.InterviewSessionRepository;
import xyz.catuns.imp.api.user.entity.User;
import xyz.catuns.imp.api.user.repository.UserRepository;
import xyz.catuns.spring.base.exception.controller.ConflictException;
import xyz.catuns.spring.base.exception.controller.NotFoundException;

import java.time.Instant;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class FeedbackService {

    private final FeedbackRepository feedbackRepository;
    private final InterviewSessionRepository sessionRepository;
    private final FeedbackMapper feedbackMapper;
    private final UserRepository userRepository;

    @PreAuthorize("hasAnyRole('ADMIN','MARKETER','SUPPORTER')")
    public FeedbackResponse getBySessionId(UUID sessionId) {
        Feedback feedback = feedbackRepository.findBySessionId(sessionId)
                .orElseThrow(() -> new NotFoundException("Feedback not found"));
        return feedbackMapper.toResponse(feedback);
    }

    @PreAuthorize("hasRole('SUPPORTER')")
    @Transactional
    public FeedbackResponse createDraft(UUID sessionId, CreateFeedbackRequest request, Authentication authentication) {
        InterviewSession session = sessionRepository.findById(sessionId)
                .orElseThrow(() -> new NotFoundException("Session not found"));

        UUID supporterId = resolveUserId(authentication.getName());
        if (!session.getSupporterId().equals(supporterId)) {
            throw new AccessDeniedException("Only the assigned supporter may create feedback for this session");
        }
        if (feedbackRepository.existsBySessionId(sessionId)) {
            throw new ConflictException("Feedback already exists for this session");
        }

        Feedback feedback = new Feedback();
        feedback.setSessionId(sessionId);
        feedback.setSupporterId(supporterId);
        feedback.setBody(request.body());
        return feedbackMapper.toResponse(feedbackRepository.save(feedback));
    }

    @PreAuthorize("hasRole('SUPPORTER')")
    @Transactional
    public FeedbackResponse update(UUID sessionId, UpdateFeedbackRequest request, Authentication authentication) {
        Feedback feedback = feedbackRepository.findBySessionId(sessionId)
                .orElseThrow(() -> new NotFoundException("Feedback not found"));

        UUID supporterId = resolveUserId(authentication.getName());
        if (!feedback.getSupporterId().equals(supporterId)) {
            throw new AccessDeniedException("Only the authoring supporter may update this feedback");
        }
        if (feedback.isSubmitted()) {
            throw new ConflictException("Feedback has already been submitted and cannot be edited");
        }

        if (request.body() != null) {
            feedback.setBody(request.body());
        }
        if (Boolean.TRUE.equals(request.isSubmitted())) {
            feedback.setSubmitted(true);
            feedback.setSubmittedAt(Instant.now());
        }

        return feedbackMapper.toResponse(feedbackRepository.save(feedback));
    }

    private UUID resolveUserId(String email) {
        return userRepository.findByEmail(email)
                .map(User::getId)
                .orElseThrow(() -> new NotFoundException("User not found"));
    }
}
