package xyz.catuns.imp.api.process.mapper;

import org.mapstruct.Mapper;
import org.mapstruct.Mapping;
import org.mapstruct.MappingTarget;
import org.mapstruct.NullValuePropertyMappingStrategy;
import xyz.catuns.imp.api.process.dto.CreateProcessRequest;
import xyz.catuns.imp.api.process.dto.InterviewProcessResponse;
import xyz.catuns.imp.api.process.dto.UpdateProcessRequest;
import xyz.catuns.imp.api.process.entity.InterviewProcess;
import xyz.catuns.imp.api.session.dto.InterviewSessionResponse;

import java.util.List;

@Mapper(
        componentModel = "spring",
        nullValuePropertyMappingStrategy = NullValuePropertyMappingStrategy.IGNORE
)
public interface InterviewProcessMapper {

    @Mapping(target = "candidateName", ignore = true)
    @Mapping(target = "clientName", ignore = true)
    @Mapping(target = "sessions", ignore = true)
    InterviewProcessResponse toResponse(InterviewProcess process);

    @Mapping(target = "candidateName", source = "candidateName")
    @Mapping(target = "clientName", source = "clientName")
    @Mapping(target = "sessions", ignore = true)
    InterviewProcessResponse toResponse(InterviewProcess process, String candidateName, String clientName);

    @Mapping(target = "candidateName", source = "candidateName")
    @Mapping(target = "clientName", source = "clientName")
    @Mapping(target = "sessions", source = "sessions")
    InterviewProcessResponse toResponse(InterviewProcess process, String candidateName, String clientName,
                                         List<InterviewSessionResponse> sessions);

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
