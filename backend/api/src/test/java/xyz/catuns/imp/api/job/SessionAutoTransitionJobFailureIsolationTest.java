package xyz.catuns.imp.api.job;

import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import xyz.catuns.imp.api.session.SessionStatusTransitionService;
import xyz.catuns.imp.api.session.entity.InterviewSession;
import xyz.catuns.imp.api.session.entity.SessionStatus;
import xyz.catuns.imp.api.session.repository.InterviewSessionRepository;

import java.time.Instant;
import java.util.List;
import java.util.UUID;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.ArgumentMatchers.isNull;
import static org.mockito.Mockito.doThrow;
import static org.mockito.Mockito.times;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class SessionAutoTransitionJobFailureIsolationTest {

    @Mock InterviewSessionRepository sessionRepository;
    @Mock SessionStatusTransitionService transitionService;

    @InjectMocks SessionAutoTransitionJob job;

    @Test
    void continuesProcessingRemainingSessionsAfterOneFails() {
        InterviewSession failing = sessionOf(UUID.randomUUID());
        InterviewSession first = sessionOf(UUID.randomUUID());
        InterviewSession second = sessionOf(UUID.randomUUID());

        when(sessionRepository.findByStatusAndScheduledAtBefore(eq(SessionStatus.SCHEDULED), any(Instant.class)))
                .thenReturn(List.of(first, failing, second));
        doThrow(new RuntimeException("boom"))
                .when(transitionService).transitionByJob(eq(failing.getId()), eq(SessionStatus.IN_REVIEW), isNull());

        job.run();

        verify(transitionService, times(1)).transitionByJob(first.getId(), SessionStatus.IN_REVIEW, null);
        verify(transitionService, times(1)).transitionByJob(failing.getId(), SessionStatus.IN_REVIEW, null);
        verify(transitionService, times(1)).transitionByJob(second.getId(), SessionStatus.IN_REVIEW, null);
    }

    private InterviewSession sessionOf(UUID id) {
        InterviewSession session = new InterviewSession();
        session.setId(id);
        return session;
    }
}
