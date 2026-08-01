package xyz.catuns.imp.api.job;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;
import xyz.catuns.imp.api.session.SessionStatusTransitionService;
import xyz.catuns.imp.api.session.entity.InterviewSession;
import xyz.catuns.imp.api.session.entity.SessionStatus;
import xyz.catuns.imp.api.session.repository.InterviewSessionRepository;

import java.time.Instant;
import java.util.List;

@Slf4j
@Component
@RequiredArgsConstructor
public class SessionAutoTransitionJob {

    private final InterviewSessionRepository sessionRepository;
    private final SessionStatusTransitionService transitionService;

    @Scheduled(cron = "${app.job.session-auto-transition.cron}")
    public void run() {
        List<InterviewSession> overdue = sessionRepository.findByStatusAndScheduledAtBefore(
                SessionStatus.SCHEDULED, Instant.now());

        for (InterviewSession session : overdue) {
            try {
                transitionService.transitionByJob(session.getId(), SessionStatus.IN_REVIEW, null);
            } catch (Exception e) {
                log.error("Failed to auto-transition session {} to IN_REVIEW", session.getId(), e);
            }
        }
    }
}
