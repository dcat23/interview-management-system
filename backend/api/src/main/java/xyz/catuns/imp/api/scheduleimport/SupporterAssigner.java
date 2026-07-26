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
import java.util.Optional;
import java.util.Set;
import java.util.UUID;

/**
 * Picks a supporter for an auto-assigned session: first excludes anyone with
 * a conflicting time window, then picks the least-loaded (fewest currently
 * SCHEDULED sessions) among those remaining.
 */
@Component
@RequiredArgsConstructor
public class SupporterAssigner {

    private static final Set<SessionStatus> EXCLUDED_FROM_CONFLICT = EnumSet.of(SessionStatus.CANCELLED, SessionStatus.NO_SHOW);

    private final InterviewSessionRepository sessionRepository;

    public Optional<UUID> assign(List<User> candidateSupporters, Instant newStart, int durationMinutes) {
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

            long load = sessionRepository.countBySupporterIdAndStatus(supporterId, SessionStatus.SCHEDULED);
            if (load < bestLoad) {
                bestLoad = load;
                best = supporterId;
            }
        }
        return Optional.ofNullable(best);
    }

    private static boolean overlaps(InterviewSession existing, Instant newStart, Instant newEnd) {
        Instant existingStart = existing.getScheduledAt();
        Instant existingEnd = existingStart.plusSeconds(existing.getDurationMinutes() * 60L);
        return existingStart.isBefore(newEnd) && newStart.isBefore(existingEnd);
    }
}
