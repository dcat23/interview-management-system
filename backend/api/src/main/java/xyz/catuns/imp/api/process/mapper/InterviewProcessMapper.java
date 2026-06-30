package xyz.catuns.imp.api.process.mapper;

import org.mapstruct.Mapper;
import org.mapstruct.Mapping;
import org.mapstruct.MappingTarget;
import org.mapstruct.NullValuePropertyMappingStrategy;
import xyz.catuns.imp.api.process.dto.CreateProcessRequest;
import xyz.catuns.imp.api.process.dto.InterviewProcessResponse;
import xyz.catuns.imp.api.process.dto.UpdateProcessRequest;
import xyz.catuns.imp.api.process.entity.InterviewProcess;

@Mapper(
        componentModel = "spring",
        nullValuePropertyMappingStrategy = NullValuePropertyMappingStrategy.IGNORE
)
public interface InterviewProcessMapper {

    InterviewProcessResponse toResponse(InterviewProcess process);

    @Mapping(target = "id", ignore = true)
    @Mapping(target = "status", ignore = true)
    @Mapping(target = "startedAt", ignore = true)
    @Mapping(target = "closedAt", ignore = true)
    @Mapping(target = "createdAt", ignore = true)
    @Mapping(target = "updatedAt", ignore = true)
    InterviewProcess toEntity(CreateProcessRequest request);

    @Mapping(target = "id", ignore = true)
    @Mapping(target = "candidateId", ignore = true)
    @Mapping(target = "clientId", ignore = true)
    @Mapping(target = "marketerId", ignore = true)
    @Mapping(target = "startedAt", ignore = true)
    @Mapping(target = "createdAt", ignore = true)
    @Mapping(target = "updatedAt", ignore = true)
    void update(UpdateProcessRequest request, @MappingTarget InterviewProcess process);
}
