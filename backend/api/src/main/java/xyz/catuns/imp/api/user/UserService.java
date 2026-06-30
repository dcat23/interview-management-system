package xyz.catuns.imp.api.user;

import lombok.RequiredArgsConstructor;
import org.springframework.cache.annotation.CacheEvict;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import xyz.catuns.imp.api.config.CacheConfig;
import xyz.catuns.imp.api.user.dto.CreateUserRequest;
import xyz.catuns.imp.api.user.dto.UpdateUserRequest;
import xyz.catuns.imp.api.user.dto.UserResponse;
import xyz.catuns.imp.api.user.entity.User;
import xyz.catuns.imp.api.user.entity.UserRole;
import xyz.catuns.imp.api.user.mapper.UserMapper;
import xyz.catuns.imp.api.user.repository.UserRepository;
import xyz.catuns.spring.base.exception.controller.ConflictException;
import xyz.catuns.spring.base.exception.controller.NotFoundException;

import java.util.UUID;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class UserService implements UserDetailsService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final UserMapper userMapper;

    @Override
    public UserDetails loadUserByUsername(String email) throws UsernameNotFoundException {
        return userRepository.findByEmail(email)
                .orElseThrow(() -> new UsernameNotFoundException("User not found: " + email));
    }

    @PreAuthorize("hasRole('ADMIN')")
    public Page<UserResponse> list(UserRole role, Boolean isActive, Pageable pageable) {
        Specification<User> spec = Specification.where(null);
        if (role != null) {
            spec = spec.and((root, query, cb) -> cb.equal(root.get("role"), role));
        }
        Boolean activeFilter = isActive != null ? isActive : true;
        spec = spec.and((root, query, cb) -> cb.equal(root.get("active"), activeFilter));
        return userRepository.findAll(spec, pageable).map(userMapper::toResponse);
    }

    @PreAuthorize("hasRole('ADMIN')")
    @Transactional
    public UserResponse create(CreateUserRequest request) {
        if (userRepository.existsByEmail(request.email())) {
            throw new ConflictException("Email already in use");
        }
        User user = userMapper.toEntity(request);
        user.setPassword(passwordEncoder.encode(request.password()));
        return userMapper.toResponse(userRepository.save(user));
    }

    @PreAuthorize("hasRole('ADMIN') or @userService.isSelf(#id, authentication.name)")
    @Cacheable(value = CacheConfig.USER_ROLES, key = "#id")
    public UserResponse getById(UUID id) {
        return userRepository.findById(id)
                .map(userMapper::toResponse)
                .orElseThrow(() -> new NotFoundException("User not found"));
    }

    @PreAuthorize("hasRole('ADMIN')")
    @Transactional
    @CacheEvict(value = CacheConfig.USER_ROLES, key = "#id")
    public UserResponse update(UUID id, UpdateUserRequest request) {
        User user = userRepository.findById(id)
                .orElseThrow(() -> new NotFoundException("User not found"));
        if (request.email() != null && !request.email().equals(user.getEmail())
                && userRepository.existsByEmail(request.email())) {
            throw new ConflictException("Email already in use");
        }
        userMapper.update(request, user);
        return userMapper.toResponse(userRepository.save(user));
    }

    public boolean isSelf(UUID id, String email) {
        return userRepository.findById(id)
                .map(u -> u.getEmail().equals(email))
                .orElse(false);
    }
}
