package xyz.catuns.imp.api.job;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.context.annotation.Import;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.test.context.ActiveProfiles;
import xyz.catuns.imp.api.TestcontainersConfiguration;
import xyz.catuns.imp.api.client.entity.Client;
import xyz.catuns.imp.api.client.repository.ClientRepository;
import xyz.catuns.imp.api.process.entity.InterviewProcess;
import xyz.catuns.imp.api.process.repository.InterviewProcessRepository;
import xyz.catuns.imp.api.session.entity.InterviewSession;
import xyz.catuns.imp.api.session.entity.SessionStatus;
import xyz.catuns.imp.api.session.repository.InterviewSessionRepository;
import xyz.catuns.imp.api.session.repository.StatusHistoryRepository;
import xyz.catuns.imp.api.user.entity.User;
import xyz.catuns.imp.api.user.entity.UserRole;
import xyz.catuns.imp.api.user.repository.UserRepository;

import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;

@SpringBootTest
@ActiveProfiles("test")
@Import(TestcontainersConfiguration.class)
class SessionAutoTransitionJobTest {

    @Autowired SessionAutoTransitionJob job;
    @Autowired UserRepository userRepository;
    @Autowired ClientRepository clientRepository;
    @Autowired InterviewProcessRepository processRepository;
    @Autowired InterviewSessionRepository sessionRepository;
    @Autowired StatusHistoryRepository statusHistoryRepository;
    @Autowired PasswordEncoder passwordEncoder;

    private UUID processId;
    private UUID supporterId;

    @BeforeEach
    void setup() {
        UUID candidateId = seedUser("job-candidate@example.com", "Job Candidate", UserRole.CANDIDATE).getId();
        UUID marketerId = seedUser("job-marketer@example.com", "Job Marketer", UserRole.MARKETER).getId();
        supporterId = seedUser("job-supporter@example.com", "Job Supporter", UserRole.SUPPORTER).getId();
        UUID clientId = seedClient("Job Test Corp", "Technology").getId();
        processId = seedProcess(candidateId, clientId, marketerId, "Java").getId();
    }

    private InterviewSession seedSession(SessionStatus status, Instant scheduledAt) {
        InterviewSession session = new InterviewSession();
        session.setProcessId(processId);
        session.setSupporterId(supporterId);
        session.setRound("Round 1");
        session.setMode("Video");
        session.setDurationMinutes(60);
        session.setScheduledAt(scheduledAt);
        session.setStatus(status);
        return sessionRepository.save(session);
    }

    private User seedUser(String email, String name, UserRole role) {
        return userRepository.findByEmail(email).orElseGet(() -> {
            User user = new User();
            user.setName(name);
            user.setEmail(email);
            user.setPassword(passwordEncoder.encode("Password123!"));
            user.setRole(role);
            return userRepository.save(user);
        });
    }

    private Client seedClient(String name, String industry) {
        return clientRepository.findAll().stream()
                .filter(c -> c.getName().equals(name))
                .findFirst()
                .orElseGet(() -> {
                    Client client = new Client();
                    client.setName(name);
                    client.setIndustry(industry);
                    return clientRepository.save(client);
                });
    }

    private InterviewProcess seedProcess(UUID candidateId, UUID clientId, UUID marketerId, String technology) {
        InterviewProcess process = new InterviewProcess();
        process.setCandidateId(candidateId);
        process.setClientId(clientId);
        process.setMarketerId(marketerId);
        process.setTechnology(technology);
        return processRepository.save(process);
    }

    @Test
    @DisplayName("overdue SCHEDULED sessions are transitioned to IN_REVIEW with BACKGROUND_JOB history")
    void transitionsOverdueSessions() {
        UUID overdueId = seedSession(SessionStatus.SCHEDULED, Instant.now().minus(1, ChronoUnit.HOURS)).getId();

        job.run();

        InterviewSession updated = sessionRepository.findById(overdueId).orElseThrow();
        assertThat(updated.getStatus()).isEqualTo(SessionStatus.IN_REVIEW);
        assertThat(updated.getStatusChangedBy()).isNull();

        var history = statusHistoryRepository.findBySessionIdOrderByChangedAtAsc(overdueId);
        assertThat(history).isNotEmpty();
        assertThat(history.getLast().getFromStatus()).isEqualTo(SessionStatus.SCHEDULED);
        assertThat(history.getLast().getToStatus()).isEqualTo(SessionStatus.IN_REVIEW);
        assertThat(history.getLast().getChangeSource().name()).isEqualTo("BACKGROUND_JOB");
        assertThat(history.getLast().getChangedBy()).isNull();
    }

    @Test
    @DisplayName("sessions scheduled in the future are left untouched")
    void leavesFutureSessionsUntouched() {
        UUID futureId = seedSession(SessionStatus.SCHEDULED, Instant.now().plus(1, ChronoUnit.HOURS)).getId();
        long historyCountBefore = statusHistoryRepository.findBySessionIdOrderByChangedAtAsc(futureId).size();

        job.run();

        InterviewSession unchanged = sessionRepository.findById(futureId).orElseThrow();
        assertThat(unchanged.getStatus()).isEqualTo(SessionStatus.SCHEDULED);
        assertThat(statusHistoryRepository.findBySessionIdOrderByChangedAtAsc(futureId))
                .hasSize((int) historyCountBefore);
    }
}
