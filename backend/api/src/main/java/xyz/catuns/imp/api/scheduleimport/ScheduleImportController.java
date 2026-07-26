package xyz.catuns.imp.api.scheduleimport;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;
import xyz.catuns.imp.api.scheduleimport.dto.ImportSummaryResponse;

@RestController
@RequestMapping("/imports/interview-schedule")
@RequiredArgsConstructor
@Tag(name = "Schedule import", description = "Bulk-import interview schedule CSVs into users, end clients, processes, and sessions")
@SecurityRequirement(name = "bearerAuth")
public class ScheduleImportController {

    private final ScheduleImportService scheduleImportService;

    @PostMapping(consumes = "multipart/form-data")
    @Operation(
            summary = "Import interview schedule CSV",
            description = "Reconciles a CSV of interview rows against users, end clients, interview processes, "
                    + "and interview sessions - creating or updating each as needed. Admin, marketer, and supporter roles."
    )
    @ApiResponses({
            @ApiResponse(responseCode = "200", description = "Import processed; see per-row results for partial failures"),
            @ApiResponse(responseCode = "400", description = "Missing or non-CSV file"),
            @ApiResponse(responseCode = "403", description = "Insufficient role")
    })
    public ResponseEntity<ImportSummaryResponse> importCsv(
            @RequestParam("file") MultipartFile file,
            Authentication authentication
    ) {
        return ResponseEntity.ok(scheduleImportService.importCsv(file, authentication));
    }
}
