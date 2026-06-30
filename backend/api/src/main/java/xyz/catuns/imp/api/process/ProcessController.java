package xyz.catuns.imp.api.process;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.PageRequest;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;
import xyz.catuns.imp.api.common.dto.PageResponse;
import xyz.catuns.imp.api.process.dto.CreateProcessRequest;
import xyz.catuns.imp.api.process.dto.InterviewProcessResponse;
import xyz.catuns.imp.api.process.dto.UpdateProcessRequest;

import java.net.URI;
import java.util.UUID;

@RestController
@RequestMapping("/processes")
@RequiredArgsConstructor
@Tag(name = "Interview Processes", description = "Interview process management")
@SecurityRequirement(name = "bearerAuth")
public class ProcessController {

    private final InterviewProcessService processService;

    @GetMapping
    @Operation(summary = "List processes", description = "Returns paginated processes. Candidates see only their own.")
    @ApiResponses({
            @ApiResponse(responseCode = "200", description = "Paginated process list"),
            @ApiResponse(responseCode = "401", description = "Unauthenticated")
    })
    public ResponseEntity<PageResponse<InterviewProcessResponse>> list(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int limit,
            Authentication authentication
    ) {
        return ResponseEntity.ok(
                PageResponse.from(processService.list(PageRequest.of(page, limit), authentication))
        );
    }

    @GetMapping("/{id}")
    @Operation(summary = "Get process by ID", description = "Candidates may only access their own process.")
    @ApiResponses({
            @ApiResponse(responseCode = "200", description = "Process found"),
            @ApiResponse(responseCode = "403", description = "Insufficient role or not the candidate's own process"),
            @ApiResponse(responseCode = "404", description = "Process not found")
    })
    public ResponseEntity<InterviewProcessResponse> getById(@PathVariable UUID id) {
        return ResponseEntity.ok(processService.getById(id));
    }

    @PostMapping
    @Operation(summary = "Create process", description = "Creates a new interview process. Admin and marketer roles only.")
    @ApiResponses({
            @ApiResponse(responseCode = "201", description = "Process created"),
            @ApiResponse(responseCode = "400", description = "Validation error"),
            @ApiResponse(responseCode = "403", description = "Insufficient role")
    })
    public ResponseEntity<InterviewProcessResponse> create(@Valid @RequestBody CreateProcessRequest request) {
        InterviewProcessResponse created = processService.create(request);
        return ResponseEntity
                .created(URI.create("/processes/" + created.id()))
                .body(created);
    }

    @PatchMapping("/{id}")
    @Operation(summary = "Update process", description = "Partially updates an interview process. Admin and marketer roles only.")
    @ApiResponses({
            @ApiResponse(responseCode = "200", description = "Process updated"),
            @ApiResponse(responseCode = "400", description = "Validation error"),
            @ApiResponse(responseCode = "403", description = "Insufficient role"),
            @ApiResponse(responseCode = "404", description = "Process not found")
    })
    public ResponseEntity<InterviewProcessResponse> update(
            @PathVariable UUID id,
            @Valid @RequestBody UpdateProcessRequest request
    ) {
        return ResponseEntity.ok(processService.update(id, request));
    }
}
