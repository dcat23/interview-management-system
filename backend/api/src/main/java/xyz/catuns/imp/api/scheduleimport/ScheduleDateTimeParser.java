package xyz.catuns.imp.api.scheduleimport;

import java.time.Instant;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.time.ZoneId;
import java.time.format.DateTimeFormatter;
import java.util.Locale;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

/**
 * Parses the sheet's "dd-MMM-yy" date column and "h[:mm] AM/PM zone"
 * time column into an Instant. The zone abbreviation (e.g. "EST") is parsed
 * but not applied literally - everything is interpreted in America/New_York
 * so DST (EST vs EDT) resolves correctly regardless of which label the sheet
 * uses for a given date.
 */
public final class ScheduleDateTimeParser {

    private static final DateTimeFormatter DATE_FORMAT = DateTimeFormatter.ofPattern("dd-MMM-yy", Locale.ENGLISH);
    private static final Pattern TIME_PATTERN = Pattern.compile("(\\d{1,2})(?::(\\d{2}))?\\s*(AM|PM)", Pattern.CASE_INSENSITIVE);
    private static final ZoneId SCHEDULING_ZONE = ZoneId.of("America/New_York");

    private ScheduleDateTimeParser() {
    }

    public static Instant parse(String dateRaw, String timeRaw) {
        if (dateRaw == null || timeRaw == null) {
            throw new IllegalArgumentException("Date and time are required");
        }

        LocalDate date;
        try {
            date = LocalDate.parse(dateRaw.trim(), DATE_FORMAT);
        } catch (Exception e) {
            throw new IllegalArgumentException("Unrecognized date format: " + dateRaw, e);
        }

        Matcher matcher = TIME_PATTERN.matcher(timeRaw.trim());
        if (!matcher.find()) {
            throw new IllegalArgumentException("Unrecognized time format: " + timeRaw);
        }

        int hour = Integer.parseInt(matcher.group(1));
        int minute = matcher.group(2) != null ? Integer.parseInt(matcher.group(2)) : 0;
        boolean pm = matcher.group(3).equalsIgnoreCase("PM");
        if (hour == 12) {
            hour = 0;
        }
        if (pm) {
            hour += 12;
        }

        LocalTime time = LocalTime.of(hour, minute);
        return LocalDateTime.of(date, time).atZone(SCHEDULING_ZONE).toInstant();
    }
}
