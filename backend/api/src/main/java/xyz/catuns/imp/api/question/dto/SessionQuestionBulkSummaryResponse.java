package xyz.catuns.imp.api.question.dto;

import java.util.List;

public record SessionQuestionBulkSummaryResponse(
        int totalItems,
        int created,
        int failed,
        List<SessionQuestionBulkItemResult> results
) {
    public static SessionQuestionBulkSummaryResponse from(List<SessionQuestionBulkItemResult> results) {
        int created = 0;
        int failed = 0;
        for (SessionQuestionBulkItemResult result : results) {
            switch (result.outcome()) {
                case CREATED -> created++;
                case FAILED -> failed++;
            }
        }
        return new SessionQuestionBulkSummaryResponse(results.size(), created, failed, results);
    }
}
