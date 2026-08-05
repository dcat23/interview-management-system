package xyz.catuns.imp.api.scheduleimport;

import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;
import xyz.catuns.imp.api.session.entity.InterviewSession;
import xyz.catuns.imp.api.session.entity.SessionStatus;
import xyz.catuns.imp.api.session.repository.InterviewSessionRepository;
import xyz.catuns.imp.api.user.entity.User;

import java.time.Duration;
import java.time.Instant;
import java.util.EnumSet;
import java.util.List;
import java.util.Set;
import java.util.UUID;
import java.util.concurrent.atomic.AtomicInteger;

import static xyz.catuns.imp.api.session.entity.SessionStatus.*;

/**
 * Picks a supporter for an auto-assigned session: first excludes anyone with
 * a conflicting time window, then picks the least-loaded (fewest currently
 * SCHEDULED sessions) among those remaining. A supporter is always assigned -
 * if every candidate has a conflicting time window, falls back to round-robin
 * over all candidates rather than failing the import row. Time conflicts are
 * a scheduling concern to resolve afterwards, not a reason to drop the row.
 */
@Component
@RequiredArgsConstructor
public class SupporterAssigner {

    private static final Set<SessionStatus> EXCLUDED_FROM_CONFLICT = EnumSet.of(CANCELLED, NO_SHOW, PASSED, REJECTED);

    private final InterviewSessionRepository sessionRepository;
    private final AtomicInteger fallbackCursor = new AtomicInteger();

    public UUID assign(List<User> candidateSupporters, Instant newStart, int durationMinutes) {
        if (candidateSupporters.isEmpty()) {
            throw new RowImportException("No supporters available to assign");
        }

        Instant newEnd = newStart.plusSeconds(durationMinutes * 60L);
        Instant windowFrom = newStart.minus(Duration.ofDays(1));

        UUID best = null;
        long bestLoad = Long.MAX_VALUE;
        for (User supporter : candidateSupporters) {
            UUID supporterId = supporter.getId();
            List<InterviewSession> existing = sessionRepository.findBySupporterIdAndScheduledAtBetweenAndStatusNotIn(
                    supporterId, windowFrom, newEnd, EXCLUDED_FROM_CONFLICT);

            boolean conflict = existing.stream().anyMatch(s -> overlaps(s, newStart, newEnd));
            if (conflict) {
                continue;
            }

            long load = sessionRepository.countBySupporterIdAndStatus(supporterId, SCHEDULED);
            if (load < bestLoad) {
                bestLoad = load;
                best = supporterId;
            }
        }

        if (best != null) {
            return best;
        }

        // Everyone conflicts - round-robin across all candidates so the row still imports.
        int index = Math.floorMod(fallbackCursor.getAndIncrement(), candidateSupporters.size());
        return candidateSupporters.get(index).getId();
    }

    private static boolean overlaps(InterviewSession existing, Instant newStart, Instant newEnd) {
        Instant existingStart = existing.getScheduledAt();
        Instant existingEnd = existingStart.plusSeconds(existing.getDurationMinutes() * 60L);
        return existingStart.isBefore(newEnd) && newStart.isBefore(existingEnd);
    }
}
