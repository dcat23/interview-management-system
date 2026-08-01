package xyz.catuns.imp.api.session;

import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.context.annotation.Import;
import org.springframework.http.MediaType;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;
import xyz.catuns.imp.api.TestcontainersConfiguration;
import xyz.catuns.imp.api.auth.dto.LoginRequest;
import xyz.catuns.imp.api.client.entity.Client;
import xyz.catuns.imp.api.client.repository.ClientRepository;
import xyz.catuns.imp.api.process.entity.InterviewProcess;
import xyz.catuns.imp.api.process.entity.ProcessStatus;
import xyz.catuns.imp.api.process.repository.InterviewProcessRepository;
import xyz.catuns.imp.api.session.dto.CreateSessionRequest;
import xyz.catuns.imp.api.session.entity.InterviewSession;
import xyz.catuns.imp.api.session.entity.SessionStatus;
import xyz.catuns.imp.api.session.repository.InterviewSessionRepository;
import xyz.catuns.imp.api.user.entity.User;
import xyz.catuns.imp.api.user.entity.UserRole;
import xyz.catuns.imp.api.user.repository.UserRepository;

import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
@Import(TestcontainersConfiguration.class)
class SessionCreationCascadeTest {

    @Autowired MockMvc mockMvc;
    @Autowired ObjectMapper objectMapper;
    @Autowired UserRepository userRepository;
    @Autowired ClientRepository clientRepository;
    @Autowired InterviewProcessRepository processRepository;
    @Autowired InterviewSessionRepository sessionRepository;
    @Autowired PasswordEncoder passwordEncoder;

    private String marketerToken;
    private UUID supporterId;
    private UUID candidateId;
    private UUID clientId;
    private UUID marketerId;

    @BeforeEach
    void setup() throws Exception {
        marketerId = seedUser("creation-cascade-marketer@example.com", "Creation Cascade Marketer", UserRole.MARKETER).getId();
        supporterId = seedUser("creation-cascade-supporter@example.com", "Creation Cascade Supporter", UserRole.SUPPORTER).getId();
        candidateId = seedUser("creation-cascade-candidate@example.com", "Creation Cascade Candidate", UserRole.CANDIDATE).getId();
        marketerToken = login("creation-cascade-marketer@example.com", "Password123!");
        clientId = seedClient("Creation Cascade Corp", "Technology").getId();
    }

    private InterviewProcess freshProcess(ProcessStatus status) {
        InterviewProcess process = new InterviewProcess();
        process.setCandidateId(candidateId);
        process.setClientId(clientId);
        process.setMarketerId(marketerId);
        process.setTechnology("Java-" + UUID.randomUUID());
        process.setStatus(status);
        if (status != ProcessStatus.ACTIVE) {
            process.setClosedAt(Instant.now());
        }
        return processRepository.save(process);
    }

    private InterviewSession sessionWithStatus(UUID processId, SessionStatus status) {
        InterviewSession session = new InterviewSession();
        session.setProcessId(processId);
        session.setSupporterId(supporterId);
        session.setRound("Round 1");
        session.setMode("Video");
        session.setDurationMinutes(60);
        session.setScheduledAt(Instant.now().plus(1, ChronoUnit.DAYS));
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

    private String login(String email, String password) throws Exception {
        String response = mockMvc.perform(post("/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(new LoginRequest(email, password))))
                .andReturn().getResponse().getContentAsString();
        return objectMapper.readTree(response).get("accessToken").asText();
    }

    private void createSession(UUID processId, String round) throws Exception {
        CreateSessionRequest request = new CreateSessionRequest(
                supporterId, round, "Video", 60, null, Instant.now().plus(2, ChronoUnit.DAYS));

        mockMvc.perform(post("/processes/" + processId + "/sessions")
                        .header("Authorization", "Bearer " + marketerToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isCreated());
    }

    @Nested
    @DisplayName("POST /processes/:id/sessions — auto-pass and reactivation cascade")
    class CreationCascade {

        @Test
        @DisplayName("prior IN_REVIEW session is auto-passed when the next round is scheduled")
        void priorInReviewSessionIsAutoPassed() throws Exception {
            InterviewProcess process = freshProcess(ProcessStatus.ACTIVE);
            InterviewSession round1 = sessionWithStatus(process.getId(), SessionStatus.IN_REVIEW);

            createSession(process.getId(), "Round 2");

            InterviewSession updatedRound1 = sessionRepository.findById(round1.getId()).orElseThrow();
            assertThat(updatedRound1.getStatus()).isEqualTo(SessionStatus.PASSED);
        }

        @Test
        @DisplayName("process ends ACTIVE, not COMPLETED, after adding the next round")
        void processEndsActiveNotCompleted() throws Exception {
            InterviewProcess process = freshProcess(ProcessStatus.ACTIVE);
            sessionWithStatus(process.getId(), SessionStatus.IN_REVIEW);

            createSession(process.getId(), "Round 2");

            InterviewProcess updated = processRepository.findById(process.getId()).orElseThrow();
            assertThat(updated.getStatus()).isEqualTo(ProcessStatus.ACTIVE);
            assertThat(updated.getClosedAt()).isNull();
        }

        @Test
        @DisplayName("scheduling a session reactivates an already-COMPLETED process")
        void reactivatesCompletedProcess() throws Exception {
            InterviewProcess process = freshProcess(ProcessStatus.COMPLETED);

            createSession(process.getId(), "Round 2");

            InterviewProcess updated = processRepository.findById(process.getId()).orElseThrow();
            assertThat(updated.getStatus()).isEqualTo(ProcessStatus.ACTIVE);
            assertThat(updated.getClosedAt()).isNull();
        }

        @Test
        @DisplayName("scheduling a session reactivates an already-WITHDRAWN process")
        void reactivatesWithdrawnProcess() throws Exception {
            InterviewProcess process = freshProcess(ProcessStatus.WITHDRAWN);

            createSession(process.getId(), "Round 2");

            InterviewProcess updated = processRepository.findById(process.getId()).orElseThrow();
            assertThat(updated.getStatus()).isEqualTo(ProcessStatus.ACTIVE);
            assertThat(updated.getClosedAt()).isNull();
        }

        @Test
        @DisplayName("a CANCELLED process is not reactivated, but the session is still created")
        void cancelledProcessIsNotReactivated() throws Exception {
            InterviewProcess process = freshProcess(ProcessStatus.CANCELLED);

            createSession(process.getId(), "Round 2");

            InterviewProcess updated = processRepository.findById(process.getId()).orElseThrow();
            assertThat(updated.getStatus()).isEqualTo(ProcessStatus.CANCELLED);
        }

        @Test
        @DisplayName("no side effect on other sessions when nothing is IN_REVIEW, process still reactivated")
        void noOpWhenNothingInReview() throws Exception {
            InterviewProcess process = freshProcess(ProcessStatus.COMPLETED);
            InterviewSession passedSession = sessionWithStatus(process.getId(), SessionStatus.PASSED);

            createSession(process.getId(), "Round 2");

            InterviewSession unchanged = sessionRepository.findById(passedSession.getId()).orElseThrow();
            assertThat(unchanged.getStatus()).isEqualTo(SessionStatus.PASSED);

            InterviewProcess updated = processRepository.findById(process.getId()).orElseThrow();
            assertThat(updated.getStatus()).isEqualTo(ProcessStatus.ACTIVE);
        }

        @Test
        @DisplayName("multiple IN_REVIEW sessions are all auto-passed")
        void multipleInReviewSessionsAllAutoPassed() throws Exception {
            InterviewProcess process = freshProcess(ProcessStatus.ACTIVE);
            InterviewSession first = sessionWithStatus(process.getId(), SessionStatus.IN_REVIEW);
            InterviewSession second = sessionWithStatus(process.getId(), SessionStatus.IN_REVIEW);

            createSession(process.getId(), "Round 3");

            assertThat(sessionRepository.findById(first.getId()).orElseThrow().getStatus())
                    .isEqualTo(SessionStatus.PASSED);
            assertThat(sessionRepository.findById(second.getId()).orElseThrow().getStatus())
                    .isEqualTo(SessionStatus.PASSED);
        }
    }
}
