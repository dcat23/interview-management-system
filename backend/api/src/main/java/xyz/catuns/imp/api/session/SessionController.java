package xyz.catuns.imp.api.session;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Pageable;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;
import xyz.catuns.imp.api.common.dto.PageResponse;
import xyz.catuns.imp.api.session.dto.CreateSessionRequest;
import xyz.catuns.imp.api.session.dto.InterviewSessionResponse;
import xyz.catuns.imp.api.session.dto.TransitionRequest;
import xyz.catuns.imp.api.session.dto.UpdateSessionRequest;
import xyz.catuns.imp.api.session.entity.SessionStatus;

import java.net.URI;
import java.time.LocalDate;
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
    @Operation(summary = "List sessions for a process", description = "Candidates see only their own process's sessions; admin, marketer, and supporter see all sessions in the process.")
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

    @GetMapping("/sessions")
    @Operation(
            summary = "List sessions",
            description = "Paginated, filterable session listing across all processes. Admin, marketer, and "
                    + "supporter roles only. Supports free-text search (candidate name, round, mode, description), a "
                    + "scheduledAt date-range filter (scheduledFrom/scheduledTo as yyyy-MM-dd, inclusive), "
                    + "and sorting (?sort=field,asc|desc - round, mode, durationMinutes, status, scheduledAt, "
                    + "statusChangedAt, createdAt, updatedAt)."
    )
    @ApiResponses({
            @ApiResponse(responseCode = "200", description = "Paginated session list"),
            @ApiResponse(responseCode = "400", description = "Unsortable field requested, or scheduledFrom after scheduledTo"),
            @ApiResponse(responseCode = "403", description = "Insufficient role")
    })
    public ResponseEntity<PageResponse<InterviewSessionResponse>> list(
            @RequestParam(required = false) String search,
            @RequestParam(required = false) SessionStatus status,
            @RequestParam(required = false) UUID processId,
            @RequestParam(required = false) UUID supporterId,
            @RequestParam(required = false) LocalDate scheduledFrom,
            @RequestParam(required = false) LocalDate scheduledTo,
            Pageable pageable
    ) {
        return ResponseEntity.ok(
                PageResponse.from(sessionService.list(search, status, processId, supporterId,
                        scheduledFrom, scheduledTo, pageable))
        );
    }

    @GetMapping("/sessions/{id}")
    @Operation(summary = "Get session by ID", description = "Candidates see only sessions belonging to their own process; admin, marketer, and supporter can access any session.")
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
