package xyz.catuns.imp.api.session.mapper;

import org.mapstruct.Mapper;
import org.mapstruct.Mapping;
import org.mapstruct.MappingTarget;
import org.mapstruct.NullValuePropertyMappingStrategy;
import xyz.catuns.imp.api.session.dto.CreateSessionRequest;
import xyz.catuns.imp.api.session.dto.InterviewSessionResponse;
import xyz.catuns.imp.api.session.dto.UpdateSessionRequest;
import xyz.catuns.imp.api.session.entity.InterviewSession;

@Mapper(
        componentModel = "spring",
        nullValuePropertyMappingStrategy = NullValuePropertyMappingStrategy.IGNORE
)
public interface InterviewSessionMapper {

    InterviewSessionResponse toResponse(InterviewSession session);

    @Mapping(target = "id", ignore = true)
    @Mapping(target = "processId", ignore = true)
    @Mapping(target = "status", ignore = true)
    @Mapping(target = "statusChangedAt", ignore = true)
    @Mapping(target = "statusChangedBy", ignore = true)
    @Mapping(target = "createdAt", ignore = true)
    @Mapping(target = "updatedAt", ignore = true)
    InterviewSession toEntity(CreateSessionRequest request);

    @Mapping(target = "id", ignore = true)
    @Mapping(target = "processId", ignore = true)
    @Mapping(target = "status", ignore = true)
    @Mapping(target = "statusChangedAt", ignore = true)
    @Mapping(target = "statusChangedBy", ignore = true)
    @Mapping(target = "createdAt", ignore = true)
    @Mapping(target = "updatedAt", ignore = true)
    void update(UpdateSessionRequest request, @MappingTarget InterviewSession session);
}
