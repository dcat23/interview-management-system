package xyz.catuns.imp.api.job;

import io.micrometer.core.instrument.MeterRegistry;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;
import xyz.catuns.imp.api.session.SessionStatusTransitionService;
import xyz.catuns.imp.api.session.entity.InterviewSession;
import xyz.catuns.imp.api.session.entity.SessionStatus;
import xyz.catuns.imp.api.session.repository.InterviewSessionRepository;

import java.time.Duration;
import java.time.Instant;
import java.util.List;

@Slf4j
@Component
@RequiredArgsConstructor
public class SessionAutoTransitionJob {

    private final InterviewSessionRepository sessionRepository;
    private final SessionStatusTransitionService transitionService;
    private final MeterRegistry meterRegistry;

    @Scheduled(cron = "${app.job.session-auto-transition.cron}")
    public void run() {
        Instant start = Instant.now();
        int transitioned = 0;
        boolean failed = false;
        try {
            List<InterviewSession> overdue = sessionRepository.findByStatusAndScheduledAtBefore(
                    SessionStatus.SCHEDULED, Instant.now());

            for (InterviewSession session : overdue) {
                try {
                    transitionService.transitionByJob(session.getId(), SessionStatus.IN_REVIEW, null);
                    transitioned++;
                } catch (Exception e) {
                    log.error("Failed to auto-transition session {} to IN_REVIEW", session.getId(), e);
                }
            }
        } catch (Exception e) {
            // Job-level failure (e.g. the overdue query itself failing) — distinct from a
            // per-session failure above, which is already logged and doesn't abort the run.
            failed = true;
            throw e;
        } finally {
            meterRegistry.counter("background.job.executions", "result", failed ? "failure" : "success")
                    .increment();
            meterRegistry.counter("background.job.sessions.transitioned").increment(transitioned);
            meterRegistry.timer("background.job.duration").record(Duration.between(start, Instant.now()));
        }
    }
}
