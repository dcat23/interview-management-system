package xyz.catuns.imp.api.question;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;
import xyz.catuns.imp.api.question.dto.*;
import xyz.catuns.imp.api.common.dto.PageResponse;

import java.util.List;
import java.util.UUID;

@RestController
@RequiredArgsConstructor
public class QuestionController {

    private final QuestionService questionService;
    private final SessionQuestionService sessionQuestionService;

    @PostMapping("/questions")
    @ResponseStatus(HttpStatus.CREATED)
    public QuestionResponse create(@Valid @RequestBody CreateQuestionRequest request,
                                   Authentication authentication) {
        return questionService.create(request, authentication);
    }

    @GetMapping("/questions")
    public PageResponse<QuestionResponse> list(
            @RequestParam(required = false) UUID clientId,
            @RequestParam(required = false) String topic,
            Pageable pageable) {
        return PageResponse.from(questionService.list(clientId, topic, pageable));
    }

    @GetMapping("/questions/{id}")
    public QuestionResponse getById(@PathVariable UUID id) {
        return questionService.getById(id);
    }

    @PatchMapping("/questions/{id}")
    public QuestionResponse update(@PathVariable UUID id,
                                   @RequestBody UpdateQuestionRequest request,
                                   Authentication authentication) {
        return questionService.update(id, request, authentication);
    }

    @DeleteMapping("/questions/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void softDelete(@PathVariable UUID id) {
        questionService.softDelete(id);
    }

    @PostMapping("/sessions/{sessionId}/questions")
    @ResponseStatus(HttpStatus.CREATED)
    public SessionQuestionResponse link(@PathVariable UUID sessionId,
                                        @Valid @RequestBody LinkQuestionRequest request) {
        return sessionQuestionService.link(sessionId, request);
    }

    @GetMapping("/sessions/{sessionId}/questions")
    public List<SessionQuestionResponse> listBySession(@PathVariable UUID sessionId) {
        return sessionQuestionService.listBySession(sessionId);
    }

    @DeleteMapping("/sessions/{sessionId}/questions/{questionId}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void unlink(@PathVariable UUID sessionId, @PathVariable UUID questionId) {
        sessionQuestionService.unlink(sessionId, questionId);
    }
}
