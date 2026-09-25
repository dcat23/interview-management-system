package xyz.catuns.imp.api.session.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import xyz.catuns.imp.api.session.entity.InterviewSession;
import xyz.catuns.imp.api.session.entity.SessionStatus;

import java.time.Instant;
import java.util.Collection;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface InterviewSessionRepository extends JpaRepository<InterviewSession, UUID>, JpaSpecificationExecutor<InterviewSession> {

    List<InterviewSession> findByProcessIdOrderByRound(UUID processId);

    List<InterviewSession> findByProcessIdOrderByScheduledAt(UUID processId);

    List<InterviewSession> findByProcessIdIn(Collection<UUID> processIds);

    List<InterviewSession> findByStatusAndScheduledAtBefore(SessionStatus status, Instant before);

    List<InterviewSession> findByProcessIdAndStatus(UUID processId, SessionStatus status);

    @Query("SELECT MIN(s.scheduledAt) FROM InterviewSession s WHERE s.processId = :processId")
    Optional<Instant> findEarliestScheduledAtByProcessId(@Param("processId") UUID processId);

    List<InterviewSession> findByProcessIdAndSupporterIdOrderByRound(UUID processId, UUID supporterId);

    Optional<InterviewSession> findByProcessIdAndRoundIgnoreCase(UUID processId, String round);

    List<InterviewSession> findBySupporterIdAndScheduledAtBetweenAndStatusNotIn(
            UUID supporterId, Instant from, Instant to, Collection<SessionStatus> excludedStatuses);

    long countBySupporterIdAndStatus(UUID supporterId, SessionStatus status);

    /**
     * Distinct modes, ranked most-used first. Case/whitespace variants collapse into one entry;
     * MIN picks a stable spelling for the group.
     */
    @Query("SELECT MIN(TRIM(s.mode)) FROM InterviewSession s WHERE TRIM(s.mode) <> '' "
            + "GROUP BY LOWER(TRIM(s.mode)) ORDER BY COUNT(s) DESC, MIN(TRIM(s.mode))")
    List<String> findDistinctModesByUsage();

    /**
     * Distinct rounds, ranked most-used first. Case/whitespace variants collapse into one entry;
     * MIN picks a stable spelling for the group.
     */
    @Query("SELECT MIN(TRIM(s.round)) FROM InterviewSession s WHERE TRIM(s.round) <> '' "
            + "GROUP BY LOWER(TRIM(s.round)) ORDER BY COUNT(s) DESC, MIN(TRIM(s.round))")
    List<String> findDistinctRoundsByUsage();
}
