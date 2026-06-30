package xyz.catuns.imp.api.client.mapper;

import org.mapstruct.Mapper;
import org.mapstruct.Mapping;
import org.mapstruct.MappingTarget;
import org.mapstruct.NullValuePropertyMappingStrategy;
import xyz.catuns.imp.api.client.dto.CreateClientRequest;
import xyz.catuns.imp.api.client.dto.ClientResponse;
import xyz.catuns.imp.api.client.dto.UpdateClientRequest;
import xyz.catuns.imp.api.client.entity.Client;

@Mapper(
        componentModel = "spring",
        nullValuePropertyMappingStrategy = NullValuePropertyMappingStrategy.IGNORE
)
public interface ClientMapper {

    ClientResponse toResponse(Client client);

    @Mapping(target = "id", ignore = true)
    @Mapping(target = "createdAt", ignore = true)
    @Mapping(target = "updatedAt", ignore = true)
    @Mapping(target = "active", constant = "true")
    Client toEntity(CreateClientRequest request);

    @Mapping(target = "id", ignore = true)
    @Mapping(target = "createdAt", ignore = true)
    @Mapping(target = "updatedAt", ignore = true)
    void update(UpdateClientRequest request, @MappingTarget Client client);
}
