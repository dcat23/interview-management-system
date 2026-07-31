package xyz.catuns.imp.api.client;

import lombok.RequiredArgsConstructor;
import org.springframework.cache.annotation.CacheEvict;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import xyz.catuns.imp.api.config.CacheConfig;
import xyz.catuns.imp.api.client.dto.ClientResponse;
import xyz.catuns.imp.api.client.dto.CreateClientRequest;
import xyz.catuns.imp.api.client.dto.UpdateClientRequest;
import xyz.catuns.imp.api.client.entity.Client;
import xyz.catuns.imp.api.client.mapper.ClientMapper;
import xyz.catuns.imp.api.client.repository.ClientRepository;
import xyz.catuns.spring.base.exception.controller.BadRequestException;
import xyz.catuns.spring.base.exception.controller.NotFoundException;

import java.util.Locale;
import java.util.Set;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class ClientService {

    private static final Set<String> SORTABLE_PROPERTIES = Set.of("name", "industry", "active", "createdAt");

    private final ClientRepository clientRepository;
    private final ClientMapper clientMapper;

    @PreAuthorize("hasAnyRole('ADMIN','MARKETER','SUPPORTER')")
    @Cacheable(value = CacheConfig.CLIENTS,
            key = "{#isActive, #search, #pageable.pageNumber, #pageable.pageSize, #pageable.sort.toString()}")
    public Page<ClientResponse> list(Boolean isActive, String search, Pageable pageable) {
        Boolean activeFilter = isActive != null ? isActive : true;
        Specification<Client> spec = (root, query, cb) -> cb.equal(root.get("active"), activeFilter);
        if (search != null && !search.isBlank()) {
            String pattern = "%" + search.trim().toLowerCase(Locale.ROOT) + "%";
            spec = spec.and((root, query, cb) -> cb.or(
                    cb.like(cb.lower(root.get("name")), pattern),
                    cb.like(cb.lower(cb.coalesce(root.get("industry"), "")), pattern)
            ));
        }
        return clientRepository.findAll(spec, validateSort(pageable)).map(clientMapper::toResponse);
    }

    private static Pageable validateSort(Pageable pageable) {
        for (Sort.Order order : pageable.getSort()) {
            if (!SORTABLE_PROPERTIES.contains(order.getProperty())) {
                throw new BadRequestException("Unsortable field: " + order.getProperty());
            }
        }
        return pageable;
    }

    @PreAuthorize("hasAnyRole('ADMIN','MARKETER')")
    @Transactional
    @CacheEvict(value = CacheConfig.CLIENTS, allEntries = true)
    public ClientResponse create(CreateClientRequest request) {
        Client client = clientMapper.toEntity(request);
        return clientMapper.toResponse(clientRepository.save(client));
    }

    @PreAuthorize("hasAnyRole('ADMIN','MARKETER')")
    @Transactional
    @CacheEvict(value = CacheConfig.CLIENTS, allEntries = true)
    public ClientResponse update(UUID id, UpdateClientRequest request) {
        Client client = clientRepository.findById(id)
                .orElseThrow(() -> new NotFoundException("Client not found"));
        clientMapper.update(request, client);
        return clientMapper.toResponse(clientRepository.save(client));
    }
}
