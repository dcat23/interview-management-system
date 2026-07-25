package xyz.catuns.imp.api.user;

import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import xyz.catuns.imp.api.user.dto.CandidateResponse;
import xyz.catuns.imp.api.user.entity.User;
import xyz.catuns.imp.api.user.entity.UserRole;
import xyz.catuns.imp.api.user.repository.UserRepository;
import xyz.catuns.spring.base.exception.controller.NotFoundException;

import java.util.List;
import java.util.UUID;

/**
 * Minimal, name-only candidate lookups for display purposes (e.g. rendering
 * a candidate's name on a process/session card). Deliberately separate from
 * UserService/UserController, which is admin-only and exposes full user
 * records — supporters/marketers need candidate names but must not gain
 * general user-lookup access via this endpoint.
 */
@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class CandidateService {

    private final UserRepository userRepository;

    @PreAuthorize("hasAnyRole('ADMIN','MARKETER','SUPPORTER')")
    public Page<CandidateResponse> list(List<UUID> ids, Pageable pageable) {
        Specification<User> spec = (root, query, cb) -> cb.equal(root.get("role"), UserRole.CANDIDATE);
        if (ids != null && !ids.isEmpty()) {
            spec = spec.and((root, query, cb) -> root.get("id").in(ids));
        }
        return userRepository.findAll(spec, pageable).map(CandidateService::toResponse);
    }

    @PreAuthorize("hasAnyRole('ADMIN','MARKETER','SUPPORTER')")
    public CandidateResponse getById(UUID id) {
        User user = userRepository.findById(id)
                .filter(u -> u.getRole() == UserRole.CANDIDATE)
                .orElseThrow(() -> new NotFoundException("Candidate not found"));
        return toResponse(user);
    }

    private static CandidateResponse toResponse(User user) {
        return new CandidateResponse(user.getId(), user.getName());
    }
}
