package xyz.catuns.imp.api.apikey;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;
import xyz.catuns.imp.api.apikey.dto.ApiKeyCreatedResponse;
import xyz.catuns.imp.api.apikey.dto.ApiKeyResponse;
import xyz.catuns.imp.api.apikey.dto.CreateApiKeyRequest;

import java.net.URI;
import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api-keys")
@RequiredArgsConstructor
@Tag(name = "API Keys", description = "Supporter-issued API keys used to authenticate MCP/AI agent traffic")
@SecurityRequirement(name = "bearerAuth")
public class ApiKeyController {

    private final ApiKeyService apiKeyService;

    @PostMapping
    @Operation(
            summary = "Issue an API key",
            description = "Creates a new AI_AGENT-scoped API key owned by the caller. The raw key is "
                    + "returned exactly once, in this response, and cannot be retrieved again. Admin and "
                    + "supporter roles."
    )
    @ApiResponses({
            @ApiResponse(responseCode = "201", description = "Key created; raw key included exactly once"),
            @ApiResponse(responseCode = "400", description = "Validation error"),
            @ApiResponse(responseCode = "403", description = "Insufficient role")
    })
    public ResponseEntity<ApiKeyCreatedResponse> create(
            @Valid @RequestBody CreateApiKeyRequest request,
            Authentication authentication
    ) {
        ApiKeyCreatedResponse created = apiKeyService.create(request, authentication);
        return ResponseEntity
                .created(URI.create("/api-keys/" + created.id()))
                .body(created);
    }

    @GetMapping
    @Operation(
            summary = "List own API keys",
            description = "Returns the caller's own API keys — prefix, scope, and status only, never "
                    + "the hash or raw key. Admin and supporter roles."
    )
    @ApiResponses({
            @ApiResponse(responseCode = "200", description = "The caller's API keys")
    })
    public ResponseEntity<List<ApiKeyResponse>> list(Authentication authentication) {
        return ResponseEntity.ok(apiKeyService.list(authentication));
    }

    @DeleteMapping("/{id}")
    @Operation(
            summary = "Revoke an API key",
            description = "Soft-revokes a key so it can no longer authenticate. Owner or admin."
    )
    @ApiResponses({
            @ApiResponse(responseCode = "204", description = "Key revoked"),
            @ApiResponse(responseCode = "403", description = "Not the owner and not an admin"),
            @ApiResponse(responseCode = "404", description = "Key not found")
    })
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void revoke(@PathVariable UUID id) {
        apiKeyService.revoke(id);
    }
}
