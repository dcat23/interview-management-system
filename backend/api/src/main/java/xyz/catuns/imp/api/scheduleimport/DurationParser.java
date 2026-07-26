package xyz.catuns.imp.api.scheduleimport;

import java.util.Locale;
import java.util.OptionalInt;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

/**
 * Parses free-text durations like "1 Hour", "45 Min", "2 Hour" into minutes.
 * Values that don't fit this shape (e.g. "Powerday") are deliberately left
 * unparsed rather than guessed - the caller should treat that as a hard
 * failure for the row.
 */
public final class DurationParser {

    private static final Pattern DURATION_PATTERN =
            Pattern.compile("(\\d+(?:\\.\\d+)?)\\s*(hour|hr|min)s?", Pattern.CASE_INSENSITIVE);

    private DurationParser() {
    }

    public static OptionalInt parseMinutes(String durationRaw) {
        if (durationRaw == null) {
            return OptionalInt.empty();
        }
        Matcher matcher = DURATION_PATTERN.matcher(durationRaw.trim());
        if (!matcher.matches()) {
            return OptionalInt.empty();
        }
        double value = Double.parseDouble(matcher.group(1));
        String unit = matcher.group(2).toLowerCase(Locale.ROOT);
        boolean isHours = unit.startsWith("hour") || unit.equals("hr");
        int minutes = (int) Math.round(isHours ? value * 60 : value);
        return minutes > 0 ? OptionalInt.of(minutes) : OptionalInt.empty();
    }
}
