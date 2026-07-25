package xyz.catuns.imp.api.user;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.PageRequest;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import xyz.catuns.imp.api.common.dto.PageResponse;
import xyz.catuns.imp.api.user.dto.CandidateResponse;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/candidates")
@RequiredArgsConstructor
@Tag(name = "Candidates", description = "Minimal candidate name lookups for display purposes — admin, marketer, and supporter roles")
@SecurityRequirement(name = "bearerAuth")
public class CandidateController {

    private final CandidateService candidateService;

    @GetMapping
    @Operation(summary = "List candidates", description = "Returns paginated candidates (id + name only). Optionally filter to a specific set of ids for batch name resolution.")
    @ApiResponses({
            @ApiResponse(responseCode = "200", description = "Paginated candidate list"),
            @ApiResponse(responseCode = "403", description = "Insufficient role")
    })
    public ResponseEntity<PageResponse<CandidateResponse>> list(
            @RequestParam(required = false) List<UUID> ids,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int limit
    ) {
        return ResponseEntity.ok(
                PageResponse.from(candidateService.list(ids, PageRequest.of(page, limit)))
        );
    }

    @GetMapping("/{id}")
    @Operation(summary = "Get candidate by ID", description = "Returns minimal candidate info (id + name).")
    @ApiResponses({
            @ApiResponse(responseCode = "200", description = "Candidate found"),
            @ApiResponse(responseCode = "403", description = "Insufficient role"),
            @ApiResponse(responseCode = "404", description = "Candidate not found")
    })
    public ResponseEntity<CandidateResponse> getById(@PathVariable UUID id) {
        return ResponseEntity.ok(candidateService.getById(id));
    }
}
