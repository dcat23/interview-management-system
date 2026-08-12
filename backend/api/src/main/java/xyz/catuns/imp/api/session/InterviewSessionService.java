package xyz.catuns.imp.api.session;

import jakarta.persistence.criteria.Join;
import jakarta.persistence.criteria.JoinType;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.cache.annotation.CacheEvict;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.context.annotation.Lazy;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import xyz.catuns.imp.api.client.entity.Client;
import xyz.catuns.imp.api.client.repository.ClientRepository;
import xyz.catuns.imp.api.common.util.DateRangeUtil;
import xyz.catuns.imp.api.config.CacheConfig;
import xyz.catuns.imp.api.process.entity.InterviewProcess;
import xyz.catuns.imp.api.process.entity.ProcessStatus;
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
import xyz.catuns.spring.base.exception.controller.BadRequestException;
import xyz.catuns.spring.base.exception.controller.NotFoundException;

import java.time.Instant;
import java.time.LocalDate;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.Set;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class InterviewSessionService {

    private static final Set<String> SORTABLE_PROPERTIES = Set.of(
            "round", "mode", "durationMinutes", "status", "scheduledAt",
            "statusChangedAt", "createdAt", "updatedAt"
    );

    private final InterviewSessionRepository sessionRepository;
    private final InterviewSessionMapper sessionMapper;
    private final InterviewProcessRepository processRepository;
    private final UserRepository userRepository;
    private final ClientRepository clientRepository;
    private final SessionStatusTransitionService transitionService;

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

        autoPassInReviewSessions(processId);

        InterviewSession session = sessionMapper.toEntity(request);
        session.setProcessId(processId);
        session = sessionRepository.save(session);
        syncProcessStartedAt(process);
        reactivateProcess(processId);
        return sessionMapper.toResponse(session, resolveCandidateName(process.getCandidateId()),
                resolveClientName(process.getClientId()), process.getTechnology());
    }

    private void autoPassInReviewSessions(UUID processId) {
        sessionRepository.findByProcessIdAndStatus(processId, SessionStatus.IN_REVIEW)
                .forEach(inReview -> transitionService.transitionByJob(inReview.getId(), SessionStatus.PASSED, null));
    }

    private void reactivateProcess(UUID processId) {
        InterviewProcess process = processRepository.findById(processId).orElseThrow();
        if (process.getStatus() == ProcessStatus.CANCELLED) {
            return;
        }
        process.setStatus(ProcessStatus.ACTIVE);
        process.setClosedAt(null);
        processRepository.save(process);
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
        InterviewProcess process = processRepository.findById(processId).orElse(null);
        String candidateName = process != null ? resolveCandidateName(process.getCandidateId()) : null;
        String clientName = process != null ? resolveClientName(process.getClientId()) : null;
        String technology = process != null ? process.getTechnology() : null;

        return sessionRepository.findByProcessIdOrderByScheduledAt(processId).stream()
                .map(session -> sessionMapper.toResponse(session, candidateName, clientName, technology))
                .toList();
    }

    @PreAuthorize("hasAnyRole('ADMIN','MARKETER','SUPPORTER','AI_AGENT')")
    public Page<InterviewSessionResponse> list(String search, SessionStatus status, UUID processId,
                                                UUID supporterId, LocalDate scheduledFrom, LocalDate scheduledTo,
                                                Pageable pageable) {
        if (scheduledFrom != null && scheduledTo != null && scheduledFrom.isAfter(scheduledTo)) {
            throw new BadRequestException("scheduledFrom must not be after scheduledTo");
        }

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
        if (scheduledFrom != null) {
            Instant from = DateRangeUtil.startOfDayUtc(scheduledFrom);
            spec = spec.and((root, query, cb) -> cb.greaterThanOrEqualTo(root.get("scheduledAt"), from));
        }
        if (scheduledTo != null) {
            Instant toExclusive = DateRangeUtil.startOfNextDayUtc(scheduledTo);
            spec = spec.and((root, query, cb) -> cb.lessThan(root.get("scheduledAt"), toExclusive));
        }
        if (search != null && !search.isBlank()) {
            String pattern = "%" + search.trim().toLowerCase(Locale.ROOT) + "%";
            spec = spec.and((root, query, cb) -> {
                Join<InterviewSession, InterviewProcess> processJoin = root.join("process", JoinType.LEFT);
                Join<InterviewProcess, User> candidateJoin = processJoin.join("candidate", JoinType.LEFT);
                return cb.or(
                        cb.like(cb.lower(candidateJoin.get("name")), pattern),
                        cb.like(cb.lower(root.get("round")), pattern),
                        cb.like(cb.lower(root.get("mode")), pattern),
                        cb.like(cb.lower(cb.coalesce(root.get("description"), "")), pattern)
                );
            });
        }
        Page<InterviewSession> sessions = sessionRepository.findAll(spec, validateSort(pageable));

        List<UUID> processIds = sessions.getContent().stream()
                .map(InterviewSession::getProcessId)
                .distinct()
                .toList();
        Map<UUID, InterviewProcess> processesById = processRepository.findAllById(processIds).stream()
                .collect(Collectors.toMap(InterviewProcess::getId, p -> p));

        List<UUID> candidateIds = processesById.values().stream()
                .map(InterviewProcess::getCandidateId)
                .distinct()
                .toList();
        List<UUID> clientIds = processesById.values().stream()
                .map(InterviewProcess::getClientId)
                .distinct()
                .toList();

        Map<UUID, String> candidateNamesById = userRepository.findAllById(candidateIds).stream()
                .collect(Collectors.toMap(User::getId, User::getName));
        Map<UUID, String> clientNamesById = clientRepository.findAllById(clientIds).stream()
                .collect(Collectors.toMap(Client::getId, Client::getName));

        return sessions.map(session -> {
            InterviewProcess process = processesById.get(session.getProcessId());
            String candidateName = process != null ? candidateNamesById.get(process.getCandidateId()) : null;
            String clientName = process != null ? clientNamesById.get(process.getClientId()) : null;
            String technology = process != null ? process.getTechnology() : null;
            return sessionMapper.toResponse(session, candidateName, clientName, technology);
        });
    }

    private static Pageable validateSort(Pageable pageable) {
        for (Sort.Order order : pageable.getSort()) {
            if (!SORTABLE_PROPERTIES.contains(order.getProperty())) {
                throw new BadRequestException("Unsortable field: " + order.getProperty());
            }
        }
        return pageable;
    }

    @PreAuthorize("hasAnyRole('ADMIN','MARKETER','SUPPORTER','AI_AGENT') " +
            "or (hasRole('CANDIDATE') and @interviewSessionService.isCandidateOwnerOfSession(#id, authentication.name))")
    public InterviewSessionResponse getById(UUID id) {
        InterviewSession session = sessionRepository.findById(id)
                .orElseThrow(() -> new NotFoundException("Session not found"));
        InterviewProcess process = processRepository.findById(session.getProcessId()).orElse(null);
        String candidateName = process != null ? resolveCandidateName(process.getCandidateId()) : null;
        String clientName = process != null ? resolveClientName(process.getClientId()) : null;
        String technology = process != null ? process.getTechnology() : null;
        return sessionMapper.toResponse(session, candidateName, clientName, technology);
    }

    @PreAuthorize("hasAnyRole('ADMIN','MARKETER')")
    @Transactional
    @CacheEvict(value = CacheConfig.SESSIONS_BY_PROCESS, allEntries = true)
    public InterviewSessionResponse update(UUID id, UpdateSessionRequest request) {
        InterviewSession session = sessionRepository.findById(id)
                .orElseThrow(() -> new NotFoundException("Session not found"));
        sessionMapper.update(request, session);
        session = sessionRepository.save(session);

        InterviewProcess process = processRepository.findById(session.getProcessId()).orElse(null);
        if (process != null) {
            syncProcessStartedAt(process);
        }
        String candidateName = process != null ? resolveCandidateName(process.getCandidateId()) : null;
        String clientName = process != null ? resolveClientName(process.getClientId()) : null;
        String technology = process != null ? process.getTechnology() : null;
        return sessionMapper.toResponse(session, candidateName, clientName, technology);
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

    private String resolveCandidateName(UUID candidateId) {
        return userRepository.findById(candidateId).map(User::getName).orElse(null);
    }

    private String resolveClientName(UUID clientId) {
        return clientRepository.findById(clientId).map(Client::getName).orElse(null);
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
