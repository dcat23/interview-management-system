package xyz.catuns.imp.api.process;

import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import xyz.catuns.imp.api.client.entity.Client;
import xyz.catuns.imp.api.client.repository.ClientRepository;
import xyz.catuns.imp.api.process.dto.CreateProcessRequest;
import xyz.catuns.imp.api.process.dto.InterviewProcessResponse;
import xyz.catuns.imp.api.process.dto.UpdateProcessRequest;
import xyz.catuns.imp.api.process.entity.InterviewProcess;
import xyz.catuns.imp.api.process.mapper.InterviewProcessMapper;
import xyz.catuns.imp.api.process.repository.InterviewProcessRepository;
import xyz.catuns.imp.api.user.entity.User;
import xyz.catuns.imp.api.user.repository.UserRepository;
import xyz.catuns.spring.base.exception.controller.NotFoundException;

import java.util.List;
import java.util.Map;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class InterviewProcessService {

    private final InterviewProcessRepository processRepository;
    private final InterviewProcessMapper processMapper;
    private final UserRepository userRepository;
    private final ClientRepository clientRepository;

    @PreAuthorize("isAuthenticated()")
    public Page<InterviewProcessResponse> list(Pageable pageable, Authentication authentication) {
        Specification<InterviewProcess> spec = Specification.unrestricted();
        if (isCandidate(authentication)) {
            UUID candidateId = resolveUserId(authentication.getName());
            spec = spec.and((root, query, cb) -> cb.equal(root.get("candidateId"), candidateId));
        }

        Page<InterviewProcess> processes = processRepository.findAll(spec, pageable);

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

        return processMapper.toResponse(process, candidateName, clientName);
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
