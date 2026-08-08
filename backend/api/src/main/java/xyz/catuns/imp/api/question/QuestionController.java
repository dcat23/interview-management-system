package xyz.catuns.imp.api.question;

import java.util.List;
import java.util.UUID;

import org.springframework.data.domain.Pageable;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import xyz.catuns.imp.api.common.dto.PageResponse;
import xyz.catuns.imp.api.question.dto.CreateQuestionRequest;
import xyz.catuns.imp.api.question.dto.LinkQuestionRequest;
import xyz.catuns.imp.api.question.dto.QuestionResponse;
import xyz.catuns.imp.api.question.dto.SessionQuestionResponse;
import xyz.catuns.imp.api.question.dto.UpdateQuestionRequest;

@RestController
@RequiredArgsConstructor
public class QuestionController {

    private final QuestionService questionService;
    private final QuestionSearchService questionSearchService;
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
            @RequestParam(required = false) String q,
            Pageable pageable) {
        if (q != null && !q.isBlank()) {
            return PageResponse.from(questionSearchService.search(q, clientId, pageable));
        }
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
