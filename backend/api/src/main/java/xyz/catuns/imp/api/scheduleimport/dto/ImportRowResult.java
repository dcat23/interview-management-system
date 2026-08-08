package xyz.catuns.imp.api.scheduleimport.dto;

import java.util.List;
import java.util.UUID;

public record ImportRowResult(
        int rowNumber,
        ImportOutcome outcome,
        UUID candidateId,
        UUID processId,
        UUID sessionId,
        List<String> warnings,
        String error
) {
    public enum ImportOutcome {
        IMPORTED, UPDATED, UNCHANGED, FAILED
    }
}
