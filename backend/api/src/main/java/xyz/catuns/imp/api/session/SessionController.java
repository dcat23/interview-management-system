package xyz.catuns.imp.api.session;

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
import xyz.catuns.imp.api.session.dto.CreateSessionRequest;
import xyz.catuns.imp.api.session.dto.InterviewSessionResponse;
import xyz.catuns.imp.api.session.dto.TransitionRequest;
import xyz.catuns.imp.api.session.dto.UpdateSessionRequest;

import java.net.URI;
import java.util.List;
import java.util.UUID;

@RestController
@RequiredArgsConstructor
@Tag(name = "Interview Sessions", description = "Interview session management")
@SecurityRequirement(name = "bearerAuth")
public class SessionController {

    private final InterviewSessionService sessionService;
    private final SessionStatusTransitionService transitionService;

    @PostMapping("/processes/{processId}/sessions")
    @Operation(summary = "Create session", description = "Creates a session under a process. Admin and marketer roles only.")
    @ApiResponses({
            @ApiResponse(responseCode = "201", description = "Session created"),
            @ApiResponse(responseCode = "400", description = "Validation error"),
            @ApiResponse(responseCode = "403", description = "Insufficient role"),
            @ApiResponse(responseCode = "404", description = "Process not found")
    })
    public ResponseEntity<InterviewSessionResponse> create(
            @PathVariable UUID processId,
            @Valid @RequestBody CreateSessionRequest request
    ) {
        InterviewSessionResponse created = sessionService.create(processId, request);
        return ResponseEntity
                .created(URI.create("/sessions/" + created.id()))
                .body(created);
    }

    @GetMapping("/processes/{processId}/sessions")
    @Operation(summary = "List sessions for a process", description = "Candidates see only their process's sessions; supporters see their assigned sessions.")
    @ApiResponses({
            @ApiResponse(responseCode = "200", description = "Session list"),
            @ApiResponse(responseCode = "403", description = "Not the candidate's own process"),
            @ApiResponse(responseCode = "404", description = "Process not found")
    })
    public ResponseEntity<List<InterviewSessionResponse>> listByProcess(
            @PathVariable UUID processId,
            Authentication authentication
    ) {
        return ResponseEntity.ok(sessionService.listByProcess(processId, authentication));
    }

    @GetMapping("/sessions/{id}")
    @Operation(summary = "Get session by ID", description = "Supporters see only their assigned sessions; candidates see only sessions belonging to their process.")
    @ApiResponses({
            @ApiResponse(responseCode = "200", description = "Session found"),
            @ApiResponse(responseCode = "403", description = "Insufficient access"),
            @ApiResponse(responseCode = "404", description = "Session not found")
    })
    public ResponseEntity<InterviewSessionResponse> getById(@PathVariable UUID id) {
        return ResponseEntity.ok(sessionService.getById(id));
    }

    @PatchMapping("/sessions/{id}")
    @Operation(summary = "Update session", description = "Partially updates a session. Admin and marketer roles only.")
    @ApiResponses({
            @ApiResponse(responseCode = "200", description = "Session updated"),
            @ApiResponse(responseCode = "400", description = "Validation error"),
            @ApiResponse(responseCode = "403", description = "Insufficient role"),
            @ApiResponse(responseCode = "404", description = "Session not found")
    })
    public ResponseEntity<InterviewSessionResponse> update(
            @PathVariable UUID id,
            @Valid @RequestBody UpdateSessionRequest request
    ) {
        return ResponseEntity.ok(sessionService.update(id, request));
    }

    @PatchMapping("/sessions/{id}/status")
    @Operation(summary = "Transition session status", description = "Applies a status transition. Permitted roles depend on the transition pair.")
    @ApiResponses({
            @ApiResponse(responseCode = "200", description = "Status transitioned"),
            @ApiResponse(responseCode = "400", description = "Validation error"),
            @ApiResponse(responseCode = "403", description = "Role not permitted for this transition"),
            @ApiResponse(responseCode = "404", description = "Session not found"),
            @ApiResponse(responseCode = "409", description = "Invalid transition for current status")
    })
    public ResponseEntity<InterviewSessionResponse> transition(
            @PathVariable UUID id,
            @Valid @RequestBody TransitionRequest request,
            Authentication authentication
    ) {
        return ResponseEntity.ok(transitionService.transition(id, request.targetStatus(), authentication));
    }
}
