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
import xyz.catuns.imp.api.session.dto.TransitionRequest;
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
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.patch;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
@Import(TestcontainersConfiguration.class)
class ProcessStatusCascadeTest {

    @Autowired MockMvc mockMvc;
    @Autowired ObjectMapper objectMapper;
    @Autowired UserRepository userRepository;
    @Autowired ClientRepository clientRepository;
    @Autowired InterviewProcessRepository processRepository;
    @Autowired InterviewSessionRepository sessionRepository;
    @Autowired PasswordEncoder passwordEncoder;
    @Autowired SessionStatusTransitionService transitionService;

    private String supporterToken;
    private UUID supporterId;
    private UUID candidateId;
    private UUID clientId;
    private UUID marketerId;

    @BeforeEach
    void setup() throws Exception {
        marketerId = seedUser("cascade-marketer@example.com", "Cascade Marketer", UserRole.MARKETER).getId();
        supporterId = seedUser("cascade-supporter@example.com", "Cascade Supporter", UserRole.SUPPORTER).getId();
        candidateId = seedUser("cascade-candidate@example.com", "Cascade Candidate", UserRole.CANDIDATE).getId();
        supporterToken = login("cascade-supporter@example.com", "Password123!");
        clientId = seedClient("Cascade Test Corp", "Technology").getId();
    }

    private InterviewProcess freshProcess(ProcessStatus status) {
        InterviewProcess process = new InterviewProcess();
        process.setCandidateId(candidateId);
        process.setClientId(clientId);
        process.setMarketerId(marketerId);
        process.setTechnology("Java-" + UUID.randomUUID());
        process.setStatus(status);
        return processRepository.save(process);
    }

    private InterviewSession freshSessionInReview(UUID processId) {
        InterviewSession session = new InterviewSession();
        session.setProcessId(processId);
        session.setSupporterId(supporterId);
        session.setRound("Round 1");
        session.setMode("Video");
        session.setDurationMinutes(60);
        session.setScheduledAt(Instant.now().plus(1, ChronoUnit.DAYS));
        session.setStatus(SessionStatus.IN_REVIEW);
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

    private void transitionSession(UUID sessionId, SessionStatus target) throws Exception {
        mockMvc.perform(patch("/sessions/" + sessionId + "/status")
                        .header("Authorization", "Bearer " + supporterToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(new TransitionRequest(target))))
                .andExpect(status().isOk());
    }

    @Nested
    @DisplayName("PASSED and REJECTED cascade to process status")
    class TerminalOutcomeCascade {

        @Test
        @DisplayName("REJECTED session withdraws an ACTIVE process")
        void rejectedWithdrawsActiveProcess() throws Exception {
            InterviewProcess process = freshProcess(ProcessStatus.ACTIVE);
            InterviewSession session = freshSessionInReview(process.getId());

            transitionSession(session.getId(), SessionStatus.REJECTED);

            InterviewProcess updated = processRepository.findById(process.getId()).orElseThrow();
            assertThat(updated.getStatus()).isEqualTo(ProcessStatus.WITHDRAWN);
            assertThat(updated.getClosedAt()).isNotNull();
        }

        @Test
        @DisplayName("PASSED session completes an ACTIVE process")
        void passedCompletesActiveProcess() throws Exception {
            InterviewProcess process = freshProcess(ProcessStatus.ACTIVE);
            InterviewSession session = freshSessionInReview(process.getId());

            transitionSession(session.getId(), SessionStatus.PASSED);

            InterviewProcess updated = processRepository.findById(process.getId()).orElseThrow();
            assertThat(updated.getStatus()).isEqualTo(ProcessStatus.COMPLETED);
            assertThat(updated.getClosedAt()).isNotNull();
        }

        @Test
        @DisplayName("a later REJECTED outcome overwrites an earlier COMPLETED status")
        void laterOutcomeOverwritesEarlierOne() throws Exception {
            InterviewProcess process = freshProcess(ProcessStatus.COMPLETED);
            InterviewSession session = freshSessionInReview(process.getId());

            transitionSession(session.getId(), SessionStatus.REJECTED);

            InterviewProcess updated = processRepository.findById(process.getId()).orElseThrow();
            assertThat(updated.getStatus()).isEqualTo(ProcessStatus.WITHDRAWN);
        }

        @Test
        @DisplayName("CANCELLED process is never overwritten by the cascade")
        void cancelledProcessIsNeverOverwritten() throws Exception {
            InterviewProcess process = freshProcess(ProcessStatus.CANCELLED);
            Instant closedAtBefore = process.getClosedAt();
            InterviewSession session = freshSessionInReview(process.getId());

            transitionSession(session.getId(), SessionStatus.PASSED);

            InterviewProcess updated = processRepository.findById(process.getId()).orElseThrow();
            assertThat(updated.getStatus()).isEqualTo(ProcessStatus.CANCELLED);
            assertThat(updated.getClosedAt()).isEqualTo(closedAtBefore);
        }

        @Test
        @DisplayName("NO_SHOW does not cascade to the process")
        void noShowDoesNotCascade() throws Exception {
            InterviewProcess process = freshProcess(ProcessStatus.ACTIVE);
            InterviewSession session = freshSessionInReview(process.getId());

            transitionSession(session.getId(), SessionStatus.NO_SHOW);

            InterviewProcess updated = processRepository.findById(process.getId()).orElseThrow();
            assertThat(updated.getStatus()).isEqualTo(ProcessStatus.ACTIVE);
            assertThat(updated.getClosedAt()).isNull();
        }

        @Test
        @DisplayName("cascade applies for BACKGROUND_JOB-sourced transitions too")
        void cascadeAppliesForBackgroundJobTransitions() {
            InterviewProcess process = freshProcess(ProcessStatus.ACTIVE);
            InterviewSession session = freshSessionInReview(process.getId());

            transitionService.transitionByJob(session.getId(), SessionStatus.REJECTED, null);

            InterviewProcess updated = processRepository.findById(process.getId()).orElseThrow();
            assertThat(updated.getStatus()).isEqualTo(ProcessStatus.WITHDRAWN);
        }
    }
}
