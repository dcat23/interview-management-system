package xyz.catuns.imp.api.client;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.PageRequest;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import xyz.catuns.imp.api.client.dto.ClientResponse;
import xyz.catuns.imp.api.client.dto.CreateClientRequest;
import xyz.catuns.imp.api.client.dto.UpdateClientRequest;
import xyz.catuns.imp.api.common.dto.PageResponse;

import java.net.URI;
import java.util.UUID;

@RestController
@RequestMapping("/clients")
@RequiredArgsConstructor
@Tag(name = "Clients", description = "End client management")
@SecurityRequirement(name = "bearerAuth")
public class ClientController {

    private final ClientService clientService;

    @GetMapping
    @Operation(summary = "List clients", description = "Returns paginated end clients. Admin, marketer, and supporter roles.")
    @ApiResponses({
            @ApiResponse(responseCode = "200", description = "Paginated client list"),
            @ApiResponse(responseCode = "403", description = "Insufficient role")
    })
    public ResponseEntity<PageResponse<ClientResponse>> list(
            @RequestParam(required = false) Boolean isActive,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int limit
    ) {
        return ResponseEntity.ok(
                PageResponse.from(clientService.list(isActive, PageRequest.of(page, limit)))
        );
    }

    @PostMapping
    @Operation(summary = "Create client", description = "Creates a new end client. Admin and marketer roles.")
    @ApiResponses({
            @ApiResponse(responseCode = "201", description = "Client created"),
            @ApiResponse(responseCode = "400", description = "Validation error"),
            @ApiResponse(responseCode = "403", description = "Insufficient role")
    })
    public ResponseEntity<ClientResponse> create(@Valid @RequestBody CreateClientRequest request) {
        ClientResponse created = clientService.create(request);
        return ResponseEntity
                .created(URI.create("/clients/" + created.id()))
                .body(created);
    }

    @PatchMapping("/{id}")
    @Operation(summary = "Update client", description = "Partially updates an end client. Admin and marketer roles.")
    @ApiResponses({
            @ApiResponse(responseCode = "200", description = "Client updated"),
            @ApiResponse(responseCode = "400", description = "Validation error"),
            @ApiResponse(responseCode = "403", description = "Insufficient role"),
            @ApiResponse(responseCode = "404", description = "Client not found")
    })
    public ResponseEntity<ClientResponse> update(
            @PathVariable UUID id,
            @Valid @RequestBody UpdateClientRequest request
    ) {
        return ResponseEntity.ok(clientService.update(id, request));
    }
}
