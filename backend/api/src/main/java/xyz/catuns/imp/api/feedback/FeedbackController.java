package xyz.catuns.imp.api.feedback;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;
import xyz.catuns.imp.api.feedback.dto.CreateFeedbackRequest;
import xyz.catuns.imp.api.feedback.dto.FeedbackResponse;
import xyz.catuns.imp.api.feedback.dto.UpdateFeedbackRequest;

import java.net.URI;
import java.util.UUID;

@RestController
@RequestMapping("/sessions/{sessionId}/feedback")
@RequiredArgsConstructor
@Tag(name = "Feedback", description = "Session feedback")
@SecurityRequirement(name = "bearerAuth")
public class FeedbackController {

    private final FeedbackService feedbackService;

    @GetMapping
    @Operation(summary = "Get feedback for a session",
            description = "Any admin, marketer, or supporter may read the feedback for any session.")
    @ApiResponses({
            @ApiResponse(responseCode = "200", description = "Feedback found"),
            @ApiResponse(responseCode = "403", description = "Insufficient role"),
            @ApiResponse(responseCode = "404", description = "No feedback record exists for this session")
    })
    public ResponseEntity<FeedbackResponse> getBySession(@PathVariable UUID sessionId) {
        return ResponseEntity.ok(feedbackService.getBySessionId(sessionId));
    }

    @PostMapping
    @Operation(summary = "Create feedback draft",
            description = "Only the session's assigned supporter may create feedback for it.")
    @ApiResponses({
            @ApiResponse(responseCode = "201", description = "Draft created"),
            @ApiResponse(responseCode = "403", description = "Not the assigned supporter"),
            @ApiResponse(responseCode = "404", description = "Session not found"),
            @ApiResponse(responseCode = "409", description = "Feedback already exists for this session")
    })
    public ResponseEntity<FeedbackResponse> create(
            @PathVariable UUID sessionId,
            @Valid @RequestBody CreateFeedbackRequest request,
            Authentication authentication
    ) {
        FeedbackResponse created = feedbackService.createDraft(sessionId, request, authentication);
        return ResponseEntity
                .created(URI.create("/sessions/" + sessionId + "/feedback"))
                .body(created);
    }

    @PatchMapping
    @Operation(summary = "Update or submit feedback",
            description = "Only the authoring supporter may update. Submitting locks the record from further edits.")
    @ApiResponses({
            @ApiResponse(responseCode = "200", description = "Feedback updated"),
            @ApiResponse(responseCode = "403", description = "Not the authoring supporter"),
            @ApiResponse(responseCode = "404", description = "No feedback record exists for this session"),
            @ApiResponse(responseCode = "409", description = "Feedback already submitted")
    })
    public ResponseEntity<FeedbackResponse> update(
            @PathVariable UUID sessionId,
            @Valid @RequestBody UpdateFeedbackRequest request,
            Authentication authentication
    ) {
        return ResponseEntity.ok(feedbackService.update(sessionId, request, authentication));
    }
}
