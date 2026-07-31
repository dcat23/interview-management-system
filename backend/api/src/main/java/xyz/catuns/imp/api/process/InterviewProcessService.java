package xyz.catuns.imp.api.process;

import jakarta.persistence.criteria.Join;
import jakarta.persistence.criteria.JoinType;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import xyz.catuns.imp.api.client.entity.Client;
import xyz.catuns.imp.api.client.repository.ClientRepository;
import xyz.catuns.imp.api.common.util.DateRangeUtil;
import xyz.catuns.imp.api.process.dto.CreateProcessRequest;
import xyz.catuns.imp.api.process.dto.InterviewProcessResponse;
import xyz.catuns.imp.api.process.dto.UpdateProcessRequest;
import xyz.catuns.imp.api.process.entity.InterviewProcess;
import xyz.catuns.imp.api.process.entity.ProcessStatus;
import xyz.catuns.imp.api.process.mapper.InterviewProcessMapper;
import xyz.catuns.imp.api.process.repository.InterviewProcessRepository;
import xyz.catuns.imp.api.session.dto.InterviewSessionResponse;
import xyz.catuns.imp.api.session.mapper.InterviewSessionMapper;
import xyz.catuns.imp.api.session.repository.InterviewSessionRepository;
import xyz.catuns.imp.api.user.entity.User;
import xyz.catuns.imp.api.user.repository.UserRepository;
import xyz.catuns.spring.base.exception.controller.BadRequestException;
import xyz.catuns.spring.base.exception.controller.NotFoundException;

import java.time.Instant;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.Set;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class InterviewProcessService {

    private static final Set<String> SORTABLE_PROPERTIES = Set.of(
            "candidateName", "clientName", "technology", "status", "startedAt", "closedAt", "createdAt", "updatedAt"
    );
    private static final Map<String, String> SORT_PROPERTY_ALIASES = Map.of(
            "candidateName", "candidate.name",
            "clientName", "client.name"
    );

    private final InterviewProcessRepository processRepository;
    private final InterviewProcessMapper processMapper;
    private final UserRepository userRepository;
    private final ClientRepository clientRepository;
    private final InterviewSessionRepository sessionRepository;
    private final InterviewSessionMapper sessionMapper;

    @PreAuthorize("isAuthenticated()")
    public Page<InterviewProcessResponse> list(String search, ProcessStatus status, UUID clientId,
                                                LocalDate startedFrom, LocalDate startedTo,
                                                Pageable pageable, Authentication authentication) {
        if (startedFrom != null && startedTo != null && startedFrom.isAfter(startedTo)) {
            throw new BadRequestException("startedFrom must not be after startedTo");
        }

        Specification<InterviewProcess> spec = Specification.unrestricted();
        if (isCandidate(authentication)) {
            UUID candidateId = resolveUserId(authentication.getName());
            spec = spec.and((root, query, cb) -> cb.equal(root.get("candidateId"), candidateId));
        }
        if (status != null) {
            spec = spec.and((root, query, cb) -> cb.equal(root.get("status"), status));
        }
        if (clientId != null) {
            spec = spec.and((root, query, cb) -> cb.equal(root.get("clientId"), clientId));
        }
        if (startedFrom != null) {
            Instant from = DateRangeUtil.startOfDayUtc(startedFrom);
            spec = spec.and((root, query, cb) -> cb.greaterThanOrEqualTo(root.get("startedAt"), from));
        }
        if (startedTo != null) {
            Instant toExclusive = DateRangeUtil.startOfNextDayUtc(startedTo);
            spec = spec.and((root, query, cb) -> cb.lessThan(root.get("startedAt"), toExclusive));
        }
        if (search != null && !search.isBlank()) {
            String pattern = "%" + search.trim().toLowerCase(Locale.ROOT) + "%";
            spec = spec.and((root, query, cb) -> {
                Join<InterviewProcess, User> candidateJoin = root.join("candidate", JoinType.LEFT);
                Join<InterviewProcess, Client> clientJoin = root.join("client", JoinType.LEFT);
                return cb.or(
                        cb.like(cb.lower(candidateJoin.get("name")), pattern),
                        cb.like(cb.lower(clientJoin.get("name")), pattern),
                        cb.like(cb.lower(root.get("technology")), pattern),
                        cb.like(cb.lower(cb.coalesce(root.get("jobId"), "")), pattern)
                );
            });
        }

        Page<InterviewProcess> processes = processRepository.findAll(spec, remapSort(pageable));

        List<UUID> candidateIds = processes.getContent().stream()
                .map(InterviewProcess::getCandidateId)
                .distinct()
                .toList();
        List<UUID> clientIds = processes.getContent().stream()
                .map(InterviewProcess::getClientId)
                .distinct()
                .toList();

        Map<UUID, String> candidateNamesById = userRepository.findAllById(candidateIds).stream()
                .collect(Collectors.toMap(User::getId, User::getName));
        Map<UUID, String> clientNamesById = clientRepository.findAllById(clientIds).stream()
                .collect(Collectors.toMap(Client::getId, Client::getName));

        return processes.map(process -> processMapper.toResponse(
                process,
                candidateNamesById.get(process.getCandidateId()),
                clientNamesById.get(process.getClientId())
        ));
    }

    @PreAuthorize("hasAnyRole('ADMIN','MARKETER','SUPPORTER') or @interviewProcessService.isCandidateOwner(#id, authentication.name)")
    public InterviewProcessResponse getById(UUID id) {
        InterviewProcess process = processRepository.findById(id)
                .orElseThrow(() -> new NotFoundException("Process not found"));

        String candidateName = userRepository.findById(process.getCandidateId())
                .map(User::getName)
                .orElse(null);
        String clientName = clientRepository.findById(process.getClientId())
                .map(Client::getName)
                .orElse(null);
        List<InterviewSessionResponse> sessions = sessionRepository.findByProcessIdOrderByScheduledAt(id).stream()
                .map(sessionMapper::toResponse)
                .toList();

        return processMapper.toResponse(process, candidateName, clientName, sessions);
    }

    @PreAuthorize("hasAnyRole('ADMIN','MARKETER')")
    @Transactional
    public InterviewProcessResponse create(CreateProcessRequest request) {
        userRepository.findById(request.candidateId())
                .orElseThrow(() -> new NotFoundException("Candidate not found"));
        userRepository.findById(request.marketerId())
                .orElseThrow(() -> new NotFoundException("Marketer not found"));
        clientRepository.findById(request.clientId())
                .orElseThrow(() -> new NotFoundException("Client not found"));

        InterviewProcess process = processMapper.toEntity(request);
        return processMapper.toResponse(processRepository.save(process));
    }

    @PreAuthorize("hasAnyRole('ADMIN','MARKETER')")
    @Transactional
    public InterviewProcessResponse update(UUID id, UpdateProcessRequest request) {
        InterviewProcess process = processRepository.findById(id)
                .orElseThrow(() -> new NotFoundException("Process not found"));
        processMapper.update(request, process);
        return processMapper.toResponse(processRepository.save(process));
    }

    public boolean isCandidateOwner(UUID processId, String email) {
        UUID userId = resolveUserId(email);
        return processRepository.findById(processId)
                .map(p -> p.getCandidateId().equals(userId))
                .orElse(false);
    }

    private static Pageable remapSort(Pageable pageable) {
        if (pageable.getSort().isUnsorted()) {
            return pageable;
        }
        List<Sort.Order> orders = new ArrayList<>();
        for (Sort.Order order : pageable.getSort()) {
            if (!SORTABLE_PROPERTIES.contains(order.getProperty())) {
                throw new BadRequestException("Unsortable field: " + order.getProperty());
            }
            orders.add(new Sort.Order(order.getDirection(),
                    SORT_PROPERTY_ALIASES.getOrDefault(order.getProperty(), order.getProperty())));
        }
        return PageRequest.of(pageable.getPageNumber(), pageable.getPageSize(), Sort.by(orders));
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
