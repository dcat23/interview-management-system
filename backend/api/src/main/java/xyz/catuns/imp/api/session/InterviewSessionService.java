package xyz.catuns.imp.api.session;

import lombok.RequiredArgsConstructor;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import xyz.catuns.imp.api.process.repository.InterviewProcessRepository;
import xyz.catuns.imp.api.session.dto.CreateSessionRequest;
import xyz.catuns.imp.api.session.dto.InterviewSessionResponse;
import xyz.catuns.imp.api.session.dto.UpdateSessionRequest;
import xyz.catuns.imp.api.session.entity.InterviewSession;
import xyz.catuns.imp.api.session.mapper.InterviewSessionMapper;
import xyz.catuns.imp.api.session.repository.InterviewSessionRepository;
import xyz.catuns.imp.api.user.entity.User;
import xyz.catuns.imp.api.user.repository.UserRepository;
import xyz.catuns.spring.base.exception.controller.NotFoundException;

import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class InterviewSessionService {

    private final InterviewSessionRepository sessionRepository;
    private final InterviewSessionMapper sessionMapper;
    private final InterviewProcessRepository processRepository;
    private final UserRepository userRepository;

    @PreAuthorize("hasAnyRole('ADMIN','MARKETER')")
    @Transactional
    public InterviewSessionResponse create(UUID processId, CreateSessionRequest request) {
        processRepository.findById(processId)
                .orElseThrow(() -> new NotFoundException("Process not found"));
        userRepository.findById(request.supporterId())
                .orElseThrow(() -> new NotFoundException("Supporter not found"));

        InterviewSession session = sessionMapper.toEntity(request);
        session.setProcessId(processId);
        return sessionMapper.toResponse(sessionRepository.save(session));
    }

    @PreAuthorize("isAuthenticated()")
    public List<InterviewSessionResponse> listByProcess(UUID processId, Authentication authentication) {
        var process = processRepository.findById(processId)
                .orElseThrow(() -> new NotFoundException("Process not found"));

        if (isCandidate(authentication)) {
            UUID userId = resolveUserId(authentication.getName());
            if (!process.getCandidateId().equals(userId)) {
                throw new AccessDeniedException("Access denied");
            }
            return sessionRepository.findByProcessIdOrderByRound(processId)
                    .stream().map(sessionMapper::toResponse).toList();
        }

        if (isSupporter(authentication)) {
            UUID userId = resolveUserId(authentication.getName());
            return sessionRepository.findByProcessIdAndSupporterIdOrderByRound(processId, userId)
                    .stream().map(sessionMapper::toResponse).toList();
        }

        return sessionRepository.findByProcessIdOrderByRound(processId)
                .stream().map(sessionMapper::toResponse).toList();
    }

    @PreAuthorize("hasAnyRole('ADMIN','MARKETER') " +
            "or (hasRole('SUPPORTER') and @interviewSessionService.isSupporterFor(#id, authentication.name)) " +
            "or (hasRole('CANDIDATE') and @interviewSessionService.isCandidateOwnerOfSession(#id, authentication.name))")
    public InterviewSessionResponse getById(UUID id) {
        return sessionRepository.findById(id)
                .map(sessionMapper::toResponse)
                .orElseThrow(() -> new NotFoundException("Session not found"));
    }

    @PreAuthorize("hasAnyRole('ADMIN','MARKETER')")
    @Transactional
    public InterviewSessionResponse update(UUID id, UpdateSessionRequest request) {
        InterviewSession session = sessionRepository.findById(id)
                .orElseThrow(() -> new NotFoundException("Session not found"));
        sessionMapper.update(request, session);
        return sessionMapper.toResponse(sessionRepository.save(session));
    }

    public boolean isSupporterFor(UUID sessionId, String email) {
        UUID userId = resolveUserId(email);
        return sessionRepository.findById(sessionId)
                .map(s -> s.getSupporterId().equals(userId))
                .orElse(false);
    }

    public boolean isCandidateOwnerOfSession(UUID sessionId, String email) {
        UUID userId = resolveUserId(email);
        return sessionRepository.findById(sessionId)
                .flatMap(s -> processRepository.findById(s.getProcessId()))
                .map(p -> p.getCandidateId().equals(userId))
                .orElse(false);
    }

    private boolean isCandidate(Authentication authentication) {
        return authentication.getAuthorities().stream()
                .anyMatch(a -> a.getAuthority().equals("ROLE_CANDIDATE"));
    }

    private boolean isSupporter(Authentication authentication) {
        return authentication.getAuthorities().stream()
                .anyMatch(a -> a.getAuthority().equals("ROLE_SUPPORTER"));
    }

    private UUID resolveUserId(String email) {
        return userRepository.findByEmail(email)
                .map(User::getId)
                .orElseThrow(() -> new NotFoundException("User not found"));
    }
}
