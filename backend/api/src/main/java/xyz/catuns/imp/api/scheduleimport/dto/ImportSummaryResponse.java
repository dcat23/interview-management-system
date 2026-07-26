package xyz.catuns.imp.api.scheduleimport.dto;

import java.util.List;

public record ImportSummaryResponse(
        int totalRows,
        int imported,
        int updated,
        int failed,
        List<ImportRowResult> results
) {
    public static ImportSummaryResponse from(List<ImportRowResult> results) {
        // Map<ImportOutcome,List<ImportRowResult>> output = new HashMap<>();
        int imported = 0;
        int updated = 0;
        int failed = 0;
        for (ImportRowResult result : results) {
            switch (result.outcome()) {
                case IMPORTED -> imported++;
                case UPDATED -> updated++;
                case FAILED -> failed++;
            }
            // output.computeIfAbsent(result.outcome(), k -> new ArrayList<>())
            //     .add(result);
        }
        return new ImportSummaryResponse(results.size(), imported, updated, failed, results);
    }
}
