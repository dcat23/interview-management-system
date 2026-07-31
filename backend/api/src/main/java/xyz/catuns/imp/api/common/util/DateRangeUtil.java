package xyz.catuns.imp.api.common.util;

import java.time.Instant;
import java.time.LocalDate;
import java.time.ZoneOffset;

/**
 * Converts a plain (timezone-less) date-range query param into the UTC instant bounds
 * used against timestamptz columns, so callers pass "2024-01-15" instead of a full instant.
 */
public final class DateRangeUtil {

    private DateRangeUtil() {
    }

    public static Instant startOfDayUtc(LocalDate date) {
        return date.atStartOfDay(ZoneOffset.UTC).toInstant();
    }

    /** Exclusive upper bound - pair with a "<" comparison to include the entire end date. */
    public static Instant startOfNextDayUtc(LocalDate date) {
        return date.plusDays(1).atStartOfDay(ZoneOffset.UTC).toInstant();
    }
}
