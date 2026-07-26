package xyz.catuns.imp.api.scheduleimport.dto;

public record ScheduleCsvRow(
        int rowNumber,
        String candidateName,
        String leadName,
        String technology,
        String dateRaw,
        String timeRaw,
        String durationRaw,
        String mode,
        String clientName,
        String round,
        String statusRaw
) {
}
