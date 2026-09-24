package xyz.catuns.imp.api.common.util;

import java.util.Comparator;
import java.util.List;
import java.util.Locale;

/**
 * Filters a usage-ranked catalog of free-text values (session modes, process technologies) for
 * autocomplete. The catalog is small and cached whole, so matching happens in memory rather than
 * as a per-keystroke query.
 */
public final class ValueLookupUtil {

    public static final int LOOKUP_RESULT_LIMIT = 20;

    private ValueLookupUtil() {
    }

    /**
     * Blank query returns the most-used values. Otherwise a case-insensitive contains match, with
     * prefix matches ranked ahead of mid-string ones; usage order is kept within each group.
     */
    public static List<String> filter(List<String> rankedValues, String query) {
        if (query == null || query.isBlank()) {
            return rankedValues.stream().limit(LOOKUP_RESULT_LIMIT).toList();
        }
        String needle = query.trim().toLowerCase(Locale.ROOT);
        return rankedValues.stream()
                .filter(value -> value.toLowerCase(Locale.ROOT).contains(needle))
                .sorted(Comparator.comparing(value -> !value.toLowerCase(Locale.ROOT).startsWith(needle)))
                .limit(LOOKUP_RESULT_LIMIT)
                .toList();
    }
}
