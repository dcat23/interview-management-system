package xyz.catuns.imp.api.process;

import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
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

import java.util.UUID;

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
        return processRepository.findAll(spec, pageable).map(processMapper::toResponse);
    }

    @PreAuthorize("hasAnyRole('ADMIN','MARKETER','SUPPORTER') or @interviewProcessService.isCandidateOwner(#id, authentication.name)")
    public InterviewProcessResponse getById(UUID id) {
        return processRepository.findById(id)
                .map(processMapper::toResponse)
                .orElseThrow(() -> new NotFoundException("Process not found"));
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
