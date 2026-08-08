package xyz.catuns.imp.api.feedback.mapper;

import org.mapstruct.Mapper;
import org.mapstruct.Mapping;
import xyz.catuns.imp.api.feedback.dto.FeedbackResponse;
import xyz.catuns.imp.api.feedback.entity.Feedback;

@Mapper(componentModel = "spring")
public interface FeedbackMapper {

    @Mapping(target = "isSubmitted", source = "submitted")
    FeedbackResponse toResponse(Feedback feedback);
}
