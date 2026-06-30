package xyz.catuns.imp.api.client;

import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import xyz.catuns.imp.api.client.dto.ClientResponse;
import xyz.catuns.imp.api.client.dto.CreateClientRequest;
import xyz.catuns.imp.api.client.dto.UpdateClientRequest;
import xyz.catuns.imp.api.client.entity.Client;
import xyz.catuns.imp.api.client.mapper.ClientMapper;
import xyz.catuns.imp.api.client.repository.ClientRepository;
import xyz.catuns.spring.base.exception.controller.NotFoundException;

import java.util.UUID;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class ClientService {

    private final ClientRepository clientRepository;
    private final ClientMapper clientMapper;

    @PreAuthorize("hasAnyRole('ADMIN','MARKETER','SUPPORTER')")
    public Page<ClientResponse> list(Boolean isActive, Pageable pageable) {
        Boolean activeFilter = isActive != null ? isActive : true;
        Specification<Client> spec = (root, query, cb) -> cb.equal(root.get("active"), activeFilter);
        return clientRepository.findAll(spec, pageable).map(clientMapper::toResponse);
    }

    @PreAuthorize("hasAnyRole('ADMIN','MARKETER')")
    @Transactional
    public ClientResponse create(CreateClientRequest request) {
        Client client = clientMapper.toEntity(request);
        return clientMapper.toResponse(clientRepository.save(client));
    }

    @PreAuthorize("hasAnyRole('ADMIN','MARKETER')")
    @Transactional
    public ClientResponse update(UUID id, UpdateClientRequest request) {
        Client client = clientRepository.findById(id)
                .orElseThrow(() -> new NotFoundException("Client not found"));
        clientMapper.update(request, client);
        return clientMapper.toResponse(clientRepository.save(client));
    }
}
