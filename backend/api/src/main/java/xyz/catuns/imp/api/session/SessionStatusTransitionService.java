package xyz.catuns.imp.api.session;

import lombok.RequiredArgsConstructor;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import xyz.catuns.imp.api.session.dto.InterviewSessionResponse;
import xyz.catuns.imp.api.session.entity.*;
import xyz.catuns.imp.api.session.exception.InvalidTransitionException;
import xyz.catuns.imp.api.session.mapper.InterviewSessionMapper;
import xyz.catuns.imp.api.session.repository.InterviewSessionRepository;
import xyz.catuns.imp.api.session.repository.StatusHistoryRepository;
import xyz.catuns.imp.api.user.entity.User;
import xyz.catuns.imp.api.user.entity.UserRole;
import xyz.catuns.imp.api.user.repository.UserRepository;
import xyz.catuns.spring.base.exception.controller.NotFoundException;

import java.time.Instant;
import java.util.*;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class SessionStatusTransitionService {

    // State machine: fromStatus → { toStatus → roles permitted }
    private static final Map<SessionStatus, Map<SessionStatus, Set<UserRole>>> ALLOWED_TRANSITIONS;

    static {
        ALLOWED_TRANSITIONS = new EnumMap<>(SessionStatus.class);

        Map<SessionStatus, Set<UserRole>> fromScheduled = new EnumMap<>(SessionStatus.class);
        fromScheduled.put(SessionStatus.IN_REVIEW, Set.of(UserRole.SUPPORTER));
        fromScheduled.put(SessionStatus.CANCELLED, Set.of(UserRole.MARKETER, UserRole.ADMIN));
        ALLOWED_TRANSITIONS.put(SessionStatus.SCHEDULED, fromScheduled);

        Map<SessionStatus, Set<UserRole>> fromInReview = new EnumMap<>(SessionStatus.class);
        fromInReview.put(SessionStatus.PASSED,   Set.of(UserRole.SUPPORTER));
        fromInReview.put(SessionStatus.REJECTED,  Set.of(UserRole.SUPPORTER));
        fromInReview.put(SessionStatus.NO_SHOW,   Set.of(UserRole.SUPPORTER, UserRole.MARKETER));
        fromInReview.put(SessionStatus.CANCELLED, Set.of(UserRole.MARKETER, UserRole.ADMIN));
        ALLOWED_TRANSITIONS.put(SessionStatus.IN_REVIEW, fromInReview);
    }

    private final InterviewSessionRepository sessionRepository;
    private final StatusHistoryRepository statusHistoryRepository;
    private final InterviewSessionMapper sessionMapper;
    private final UserRepository userRepository;

    @PreAuthorize("isAuthenticated()")
    @Transactional
    public InterviewSessionResponse transition(UUID sessionId, SessionStatus targetStatus, Authentication authentication) {
        UUID actorId = resolveUserId(authentication.getName());
        UserRole actorRole = resolveRole(authentication);

        InterviewSession session = sessionRepository.findById(sessionId)
                .orElseThrow(() -> new NotFoundException("Session not found"));

        validateTransition(session.getStatus(), targetStatus, actorRole);
        return applyTransition(session, targetStatus, actorId, ChangeSource.MANUAL);
    }

    @Transactional
    public InterviewSessionResponse transitionByJob(UUID sessionId, SessionStatus targetStatus, UUID systemActorId) {
        InterviewSession session = sessionRepository.findById(sessionId)
                .orElseThrow(() -> new NotFoundException("Session not found"));

        SessionStatus fromStatus = session.getStatus();
        Map<SessionStatus, Set<UserRole>> targets = ALLOWED_TRANSITIONS.get(fromStatus);
        if (targets == null || !targets.containsKey(targetStatus)) {
            throw new InvalidTransitionException(fromStatus, targetStatus);
        }

        return applyTransition(session, targetStatus, systemActorId, ChangeSource.BACKGROUND_JOB);
    }

    private void validateTransition(SessionStatus from, SessionStatus to, UserRole role) {
        Map<SessionStatus, Set<UserRole>> targets = ALLOWED_TRANSITIONS.get(from);
        if (targets == null || !targets.containsKey(to)) {
            throw new InvalidTransitionException(from, to);
        }
        Set<UserRole> allowedRoles = targets.get(to);
        if (!allowedRoles.contains(role)) {
            throw new AccessDeniedException(
                    "Role " + role + " is not permitted to transition from " + from + " to " + to);
        }
    }

    private InterviewSessionResponse applyTransition(InterviewSession session, SessionStatus toStatus,
                                                      UUID actorId, ChangeSource changeSource) {
        SessionStatus fromStatus = session.getStatus();

        session.setStatus(toStatus);
        session.setStatusChangedAt(Instant.now());
        session.setStatusChangedBy(actorId);
        sessionRepository.save(session);

        StatusHistory history = new StatusHistory();
        history.setSessionId(session.getId());
        history.setFromStatus(fromStatus);
        history.setToStatus(toStatus);
        history.setChangedBy(actorId);
        history.setChangeSource(changeSource);
        statusHistoryRepository.save(history);

        return sessionMapper.toResponse(session);
    }

    private UUID resolveUserId(String email) {
        return userRepository.findByEmail(email)
                .map(User::getId)
                .orElseThrow(() -> new NotFoundException("User not found"));
    }

    private UserRole resolveRole(Authentication authentication) {
        return authentication.getAuthorities().stream()
                .map(a -> a.getAuthority().replace("ROLE_", ""))
                .map(UserRole::valueOf)
                .findFirst()
                .orElseThrow(() -> new AccessDeniedException("No role assigned"));
    }
}
