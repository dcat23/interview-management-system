package xyz.catuns.imp.api.session;

import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.cache.annotation.CacheEvict;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.context.annotation.Lazy;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import xyz.catuns.imp.api.config.CacheConfig;
import xyz.catuns.imp.api.process.entity.InterviewProcess;
import xyz.catuns.imp.api.process.repository.InterviewProcessRepository;
import xyz.catuns.imp.api.session.dto.CreateSessionRequest;
import xyz.catuns.imp.api.session.dto.InterviewSessionResponse;
import xyz.catuns.imp.api.session.dto.UpdateSessionRequest;
import xyz.catuns.imp.api.session.entity.InterviewSession;
import xyz.catuns.imp.api.session.entity.SessionStatus;
import xyz.catuns.imp.api.session.mapper.InterviewSessionMapper;
import xyz.catuns.imp.api.session.repository.InterviewSessionRepository;
import xyz.catuns.imp.api.user.entity.User;
import xyz.catuns.imp.api.user.repository.UserRepository;
import xyz.catuns.spring.base.exception.controller.NotFoundException;

import java.time.Instant;
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

    // Self-injection via @Lazy so @Cacheable proxy intercepts loadAllByProcess from within listByProcess
    @Autowired
    @Lazy
    private InterviewSessionService self;

    @PreAuthorize("hasAnyRole('ADMIN','MARKETER')")
    @Transactional
    @CacheEvict(value = CacheConfig.SESSIONS_BY_PROCESS, key = "#processId")
    public InterviewSessionResponse create(UUID processId, CreateSessionRequest request) {
        InterviewProcess process = processRepository.findById(processId)
                .orElseThrow(() -> new NotFoundException("Process not found"));
        userRepository.findById(request.supporterId())
                .orElseThrow(() -> new NotFoundException("Supporter not found"));

        InterviewSession session = sessionMapper.toEntity(request);
        session.setProcessId(processId);
        session = sessionRepository.save(session);
        syncProcessStartedAt(process);
        return sessionMapper.toResponse(session);
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
        }

        return self.loadAllByProcess(processId);
    }

    @Cacheable(value = CacheConfig.SESSIONS_BY_PROCESS, key = "#processId")
    public List<InterviewSessionResponse> loadAllByProcess(UUID processId) {
        return sessionRepository.findByProcessIdOrderByRound(processId)
                .stream().map(sessionMapper::toResponse).toList();
    }

    @PreAuthorize("hasAnyRole('ADMIN','MARKETER','SUPPORTER')")
    public Page<InterviewSessionResponse> list(SessionStatus status, UUID processId, UUID supporterId, Pageable pageable) {
        Specification<InterviewSession> spec = Specification.unrestricted();
        if (status != null) {
            spec = spec.and((root, query, cb) -> cb.equal(root.get("status"), status));
        }
        if (processId != null) {
            spec = spec.and((root, query, cb) -> cb.equal(root.get("processId"), processId));
        }
        if (supporterId != null) {
            spec = spec.and((root, query, cb) -> cb.equal(root.get("supporterId"), supporterId));
        }
        return sessionRepository.findAll(spec, pageable).map(sessionMapper::toResponse);
    }

    @PreAuthorize("hasAnyRole('ADMIN','MARKETER','SUPPORTER') " +
            "or (hasRole('CANDIDATE') and @interviewSessionService.isCandidateOwnerOfSession(#id, authentication.name))")
    public InterviewSessionResponse getById(UUID id) {
        return sessionRepository.findById(id)
                .map(sessionMapper::toResponse)
                .orElseThrow(() -> new NotFoundException("Session not found"));
    }

    @PreAuthorize("hasAnyRole('ADMIN','MARKETER')")
    @Transactional
    @CacheEvict(value = CacheConfig.SESSIONS_BY_PROCESS, allEntries = true)
    public InterviewSessionResponse update(UUID id, UpdateSessionRequest request) {
        InterviewSession session = sessionRepository.findById(id)
                .orElseThrow(() -> new NotFoundException("Session not found"));
        sessionMapper.update(request, session);
        session = sessionRepository.save(session);

        processRepository.findById(session.getProcessId()).ifPresent(this::syncProcessStartedAt);
        return sessionMapper.toResponse(session);
    }

    private void syncProcessStartedAt(InterviewProcess process) {
        Instant earliestScheduledAt = sessionRepository.findEarliestScheduledAtByProcessId(process.getId())
                .orElse(process.getStartedAt());
        if (!earliestScheduledAt.equals(process.getStartedAt())) {
            process.setStartedAt(earliestScheduledAt);
            processRepository.save(process);
        }
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

    private UUID resolveUserId(String email) {
        return userRepository.findByEmail(email)
                .map(User::getId)
                .orElseThrow(() -> new NotFoundException("User not found"));
    }
}
