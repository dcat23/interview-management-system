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
import xyz.catuns.imp.api.process.repository.InterviewProcessRepository;
import xyz.catuns.imp.api.session.dto.TransitionRequest;
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
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
@Import(TestcontainersConfiguration.class)
class StatusTransitionTest {

    @Autowired MockMvc mockMvc;
    @Autowired ObjectMapper objectMapper;
    @Autowired UserRepository userRepository;
    @Autowired ClientRepository clientRepository;
    @Autowired InterviewProcessRepository processRepository;
    @Autowired InterviewSessionRepository sessionRepository;
    @Autowired StatusHistoryRepository statusHistoryRepository;
    @Autowired PasswordEncoder passwordEncoder;

    private static final String ADMIN_EMAIL        = "trans-admin@example.com";
    private static final String ADMIN_PASSWORD     = "AdminPassword123!";
    private static final String MARKETER_EMAIL     = "trans-marketer@example.com";
    private static final String MARKETER_PASSWORD  = "MarketerPass123!";
    private static final String SUPPORTER_EMAIL    = "trans-supporter@example.com";
    private static final String SUPPORTER_PASSWORD = "SupporterPass123!";
    private static final String CANDIDATE_EMAIL    = "trans-candidate@example.com";
    private static final String CANDIDATE_PASSWORD = "CandidatePass123!";

    private String adminToken;
    private String marketerToken;
    private String supporterToken;
    private String candidateToken;

    private UUID supporterId;
    private UUID processId;

    @BeforeEach
    void setup() throws Exception {
        UUID adminId     = seedUser(ADMIN_EMAIL,     "Trans Admin",     ADMIN_PASSWORD,     UserRole.ADMIN).getId();
        UUID marketerId  = seedUser(MARKETER_EMAIL,  "Trans Marketer",  MARKETER_PASSWORD,  UserRole.MARKETER).getId();
        supporterId      = seedUser(SUPPORTER_EMAIL, "Trans Supporter", SUPPORTER_PASSWORD, UserRole.SUPPORTER).getId();
        UUID candidateId = seedUser(CANDIDATE_EMAIL, "Trans Candidate", CANDIDATE_PASSWORD, UserRole.CANDIDATE).getId();

        adminToken     = login(ADMIN_EMAIL,     ADMIN_PASSWORD);
        marketerToken  = login(MARKETER_EMAIL,  MARKETER_PASSWORD);
        supporterToken = login(SUPPORTER_EMAIL, SUPPORTER_PASSWORD);
        candidateToken = login(CANDIDATE_EMAIL, CANDIDATE_PASSWORD);

        UUID clientId = seedClient("Trans Test Corp", "Technology").getId();
        processId = seedProcess(candidateId, clientId, marketerId, "Java").getId();
    }

    // Creates a fresh SCHEDULED session for each test scenario
    private InterviewSession freshSession() {
        InterviewSession session = new InterviewSession();
        session.setProcessId(processId);
        session.setSupporterId(supporterId);
        session.setRound("Round 1");
        session.setMode("Video");
        session.setDurationMinutes(60);
        session.setScheduledAt(Instant.now().plus(7, ChronoUnit.DAYS));
        return sessionRepository.save(session);
    }

    private InterviewSession freshSessionWithStatus(SessionStatus status) {
        InterviewSession session = freshSession();
        session.setStatus(status);
        return sessionRepository.save(session);
    }

    private User seedUser(String email, String name, String password, UserRole role) {
        return userRepository.findByEmail(email).orElseGet(() -> {
            User user = new User();
            user.setName(name);
            user.setEmail(email);
            user.setPassword(passwordEncoder.encode(password));
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
        return processRepository.findAll().stream()
                .filter(p -> p.getCandidateId().equals(candidateId) && p.getTechnology().equals(technology))
                .findFirst()
                .orElseGet(() -> {
                    InterviewProcess process = new InterviewProcess();
                    process.setCandidateId(candidateId);
                    process.setClientId(clientId);
                    process.setMarketerId(marketerId);
                    process.setTechnology(technology);
                    return processRepository.save(process);
                });
    }

    private String login(String email, String password) throws Exception {
        String response = mockMvc.perform(post("/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(new LoginRequest(email, password))))
                .andReturn().getResponse().getContentAsString();
        return objectMapper.readTree(response).get("accessToken").asText();
    }

    @Nested
    @DisplayName("PATCH /sessions/{id}/status — valid transitions")
    class ValidTransitions {

        @Test
        @DisplayName("SCHEDULED → IN_REVIEW by supporter succeeds and writes STATUS_HISTORY")
        void scheduledToInReviewBySupporter() throws Exception {
            UUID sessionId = freshSession().getId();
            long historyCountBefore = statusHistoryRepository.findBySessionIdOrderByChangedAtAsc(sessionId).size();

            mockMvc.perform(patch("/sessions/" + sessionId + "/status")
                            .header("Authorization", "Bearer " + supporterToken)
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(objectMapper.writeValueAsString(new TransitionRequest(SessionStatus.IN_REVIEW))))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.status").value("IN_REVIEW"));

            InterviewSession updated = sessionRepository.findById(sessionId).orElseThrow();
            assertThat(updated.getStatus()).isEqualTo(SessionStatus.IN_REVIEW);
            assertThat(updated.getStatusChangedAt()).isNotNull();
            assertThat(updated.getStatusChangedBy()).isEqualTo(supporterId);

            var history = statusHistoryRepository.findBySessionIdOrderByChangedAtAsc(sessionId);
            assertThat(history).hasSize((int) historyCountBefore + 1);
            assertThat(history.getLast().getFromStatus()).isEqualTo(SessionStatus.SCHEDULED);
            assertThat(history.getLast().getToStatus()).isEqualTo(SessionStatus.IN_REVIEW);
            assertThat(history.getLast().getChangeSource().name()).isEqualTo("MANUAL");
        }

        @Test
        @DisplayName("IN_REVIEW → PASSED by supporter succeeds")
        void inReviewToPassedBySupporter() throws Exception {
            UUID sessionId = freshSessionWithStatus(SessionStatus.IN_REVIEW).getId();

            mockMvc.perform(patch("/sessions/" + sessionId + "/status")
                            .header("Authorization", "Bearer " + supporterToken)
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(objectMapper.writeValueAsString(new TransitionRequest(SessionStatus.PASSED))))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.status").value("PASSED"));
        }

        @Test
        @DisplayName("IN_REVIEW → REJECTED by supporter succeeds")
        void inReviewToRejectedBySupporter() throws Exception {
            UUID sessionId = freshSessionWithStatus(SessionStatus.IN_REVIEW).getId();

            mockMvc.perform(patch("/sessions/" + sessionId + "/status")
                            .header("Authorization", "Bearer " + supporterToken)
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(objectMapper.writeValueAsString(new TransitionRequest(SessionStatus.REJECTED))))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.status").value("REJECTED"));
        }

        @Test
        @DisplayName("IN_REVIEW → NO_SHOW by marketer succeeds")
        void inReviewToNoShowByMarketer() throws Exception {
            UUID sessionId = freshSessionWithStatus(SessionStatus.IN_REVIEW).getId();

            mockMvc.perform(patch("/sessions/" + sessionId + "/status")
                            .header("Authorization", "Bearer " + marketerToken)
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(objectMapper.writeValueAsString(new TransitionRequest(SessionStatus.NO_SHOW))))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.status").value("NO_SHOW"));
        }

        @Test
        @DisplayName("SCHEDULED → CANCELLED by admin succeeds")
        void scheduledToCancelledByAdmin() throws Exception {
            UUID sessionId = freshSession().getId();

            mockMvc.perform(patch("/sessions/" + sessionId + "/status")
                            .header("Authorization", "Bearer " + adminToken)
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(objectMapper.writeValueAsString(new TransitionRequest(SessionStatus.CANCELLED))))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.status").value("CANCELLED"));
        }
    }

    @Nested
    @DisplayName("PATCH /sessions/{id}/status — invalid transitions")
    class InvalidTransitions {

        @Test
        @DisplayName("IN_REVIEW → SCHEDULED returns 409 and writes no STATUS_HISTORY")
        void invalidTransitionReturns409() throws Exception {
            UUID sessionId = freshSessionWithStatus(SessionStatus.IN_REVIEW).getId();
            long historyCountBefore = statusHistoryRepository.findBySessionIdOrderByChangedAtAsc(sessionId).size();

            mockMvc.perform(patch("/sessions/" + sessionId + "/status")
                            .header("Authorization", "Bearer " + supporterToken)
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(objectMapper.writeValueAsString(new TransitionRequest(SessionStatus.SCHEDULED))))
                    .andExpect(status().isConflict());

            assertThat(statusHistoryRepository.findBySessionIdOrderByChangedAtAsc(sessionId))
                    .hasSize((int) historyCountBefore);
        }

        @Test
        @DisplayName("PASSED → IN_REVIEW (terminal state) returns 409")
        void terminalStateTransitionReturns409() throws Exception {
            UUID sessionId = freshSessionWithStatus(SessionStatus.PASSED).getId();

            mockMvc.perform(patch("/sessions/" + sessionId + "/status")
                            .header("Authorization", "Bearer " + adminToken)
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(objectMapper.writeValueAsString(new TransitionRequest(SessionStatus.IN_REVIEW))))
                    .andExpect(status().isConflict());
        }

        @Test
        @DisplayName("missing targetStatus returns 400")
        void missingTargetStatusReturns400() throws Exception {
            UUID sessionId = freshSession().getId();

            mockMvc.perform(patch("/sessions/" + sessionId + "/status")
                            .header("Authorization", "Bearer " + supporterToken)
                            .contentType(MediaType.APPLICATION_JSON)
                            .content("{}"))
                    .andExpect(status().isBadRequest());
        }
    }

    @Nested
    @DisplayName("PATCH /sessions/{id}/status — role enforcement")
    class RoleEnforcement {

        @Test
        @DisplayName("marketer cannot do SCHEDULED → IN_REVIEW (supporter only) → 403")
        void marketerCannotDoSupporterTransition() throws Exception {
            UUID sessionId = freshSession().getId();

            mockMvc.perform(patch("/sessions/" + sessionId + "/status")
                            .header("Authorization", "Bearer " + marketerToken)
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(objectMapper.writeValueAsString(new TransitionRequest(SessionStatus.IN_REVIEW))))
                    .andExpect(status().isForbidden());
        }

        @Test
        @DisplayName("supporter cannot do SCHEDULED → CANCELLED (marketer/admin only) → 403")
        void supporterCannotCancelFromScheduled() throws Exception {
            UUID sessionId = freshSession().getId();

            mockMvc.perform(patch("/sessions/" + sessionId + "/status")
                            .header("Authorization", "Bearer " + supporterToken)
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(objectMapper.writeValueAsString(new TransitionRequest(SessionStatus.CANCELLED))))
                    .andExpect(status().isForbidden());
        }

        @Test
        @DisplayName("candidate cannot perform any transition → 403")
        void candidateCannotTransition() throws Exception {
            UUID sessionId = freshSession().getId();

            mockMvc.perform(patch("/sessions/" + sessionId + "/status")
                            .header("Authorization", "Bearer " + candidateToken)
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(objectMapper.writeValueAsString(new TransitionRequest(SessionStatus.IN_REVIEW))))
                    .andExpect(status().isForbidden());
        }

        @Test
        @DisplayName("unauthenticated → 401")
        void unauthenticatedCannotTransition() throws Exception {
            UUID sessionId = freshSession().getId();

            mockMvc.perform(patch("/sessions/" + sessionId + "/status")
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(objectMapper.writeValueAsString(new TransitionRequest(SessionStatus.IN_REVIEW))))
                    .andExpect(status().isUnauthorized());
        }
    }

    @Nested
    @DisplayName("PATCH /sessions/{id}/status — not found")
    class NotFound {

        @Test
        @DisplayName("non-existent session → 404")
        void nonExistentSessionReturns404() throws Exception {
            mockMvc.perform(patch("/sessions/" + UUID.randomUUID() + "/status")
                            .header("Authorization", "Bearer " + supporterToken)
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(objectMapper.writeValueAsString(new TransitionRequest(SessionStatus.IN_REVIEW))))
                    .andExpect(status().isNotFound());
        }
    }
}
