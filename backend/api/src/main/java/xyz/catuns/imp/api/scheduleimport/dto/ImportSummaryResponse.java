package xyz.catuns.imp.api.scheduleimport.dto;

import java.util.List;

public record ImportSummaryResponse(
        int totalRows,
        int imported,
        int updated,
        int unchanged,
        int failed,
        List<ImportRowResult> results
) {
    public static ImportSummaryResponse from(List<ImportRowResult> results) {
        int imported = 0;
        int updated = 0;
        int unchanged = 0;
        int failed = 0;
        for (ImportRowResult result : results) {
            switch (result.outcome()) {
                case IMPORTED -> imported++;
                case UPDATED -> updated++;
                case UNCHANGED -> unchanged++;
                case FAILED -> failed++;
            }
        }
        return new ImportSummaryResponse(results.size(), imported, updated, unchanged, failed, results);
    }
}
