package xyz.catuns.imp.api.scheduleimport;

import java.util.Optional;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

/**
 * Extracts a requisition/job code from a free-text technology string, e.g.
 * "Java Developer (9548BR)" "9548BR". Only the trailing parenthetical is
 * considered, and it must contain at least one digit to qualify - this
 * filters out non-code annotations like "Fullstack Engineer(VP)" where the
 * parens denote a seniority level rather than a requisition id.
 */
public final class JobIdExtractor {

    private static final Pattern TRAILING_PAREN = Pattern.compile("\\(([A-Za-z0-9]+)\\)\\s*$");
    private static final Pattern CONTAINS_DIGIT = Pattern.compile(".*\\d.*");

    private JobIdExtractor() {
    }

    public static Optional<String> extract(String technology) {
        if (technology == null) {
            return Optional.empty();
        }
        Matcher matcher = TRAILING_PAREN.matcher(technology.trim());
        if (!matcher.find()) {
            return Optional.empty();
        }
        String code = matcher.group(1);
        if (!CONTAINS_DIGIT.matcher(code).matches()) {
            return Optional.empty();
        }
        return Optional.of(code);
    }
}
