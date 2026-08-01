package xyz.catuns.imp.api.feedback;

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
import xyz.catuns.imp.api.session.entity.InterviewSession;
import xyz.catuns.imp.api.session.entity.SessionStatus;
import xyz.catuns.imp.api.session.repository.InterviewSessionRepository;
import xyz.catuns.imp.api.user.entity.User;
import xyz.catuns.imp.api.user.entity.UserRole;
import xyz.catuns.imp.api.user.repository.UserRepository;

import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.UUID;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
@Import(TestcontainersConfiguration.class)
class FeedbackControllerTest {

    @Autowired MockMvc mockMvc;
    @Autowired ObjectMapper objectMapper;
    @Autowired UserRepository userRepository;
    @Autowired ClientRepository clientRepository;
    @Autowired InterviewProcessRepository processRepository;
    @Autowired InterviewSessionRepository sessionRepository;
    @Autowired PasswordEncoder passwordEncoder;

    private static final String PASSWORD = "Password123!";

    private String adminToken;
    private String marketerToken;
    private String supporterAToken;
    private String supporterBToken;
    private String candidateToken;

    private UUID supporterAId;
    private UUID processId;

    @BeforeEach
    void setup() throws Exception {
        UUID adminId = seedUser("fb-admin@example.com", "FB Admin", UserRole.ADMIN).getId();
        UUID marketerId = seedUser("fb-marketer@example.com", "FB Marketer", UserRole.MARKETER).getId();
        supporterAId = seedUser("fb-supporter-a@example.com", "FB Supporter A", UserRole.SUPPORTER).getId();
        UUID supporterBId = seedUser("fb-supporter-b@example.com", "FB Supporter B", UserRole.SUPPORTER).getId();
        UUID candidateId = seedUser("fb-candidate@example.com", "FB Candidate", UserRole.CANDIDATE).getId();

        adminToken = login("fb-admin@example.com");
        marketerToken = login("fb-marketer@example.com");
        supporterAToken = login("fb-supporter-a@example.com");
        supporterBToken = login("fb-supporter-b@example.com");
        candidateToken = login("fb-candidate@example.com");

        UUID clientId = seedClient("FB Test Corp", "Technology").getId();

        InterviewProcess process = new InterviewProcess();
        process.setCandidateId(candidateId);
        process.setClientId(clientId);
        process.setMarketerId(marketerId);
        process.setTechnology("Java-" + UUID.randomUUID());
        processId = processRepository.save(process).getId();
    }

    private UUID freshSessionForSupporterA() {
        InterviewSession session = new InterviewSession();
        session.setProcessId(processId);
        session.setSupporterId(supporterAId);
        session.setRound("Round " + UUID.randomUUID());
        session.setMode("Video");
        session.setDurationMinutes(60);
        session.setScheduledAt(Instant.now().plus(1, ChronoUnit.DAYS));
        session.setStatus(SessionStatus.IN_REVIEW);
        return sessionRepository.save(session).getId();
    }

    private User seedUser(String email, String name, UserRole role) {
        return userRepository.findByEmail(email).orElseGet(() -> {
            User user = new User();
            user.setName(name);
            user.setEmail(email);
            user.setPassword(passwordEncoder.encode(PASSWORD));
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

    private String login(String email) throws Exception {
        String response = mockMvc.perform(post("/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(new LoginRequest(email, PASSWORD))))
                .andReturn().getResponse().getContentAsString();
        return objectMapper.readTree(response).get("accessToken").asText();
    }

    private String createDraft(UUID sessionId, String token, String body) throws Exception {
        return mockMvc.perform(post("/sessions/" + sessionId + "/feedback")
                        .header("Authorization", "Bearer " + token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"body\":\"" + body + "\"}"))
                .andReturn().getResponse().getContentAsString();
    }

    @Nested
    @DisplayName("POST /sessions/:id/feedback")
    class Create {

        @Test
        @DisplayName("assigned supporter creates a draft")
        void assignedSupporterCreatesDraft() throws Exception {
            UUID sessionId = freshSessionForSupporterA();

            mockMvc.perform(post("/sessions/" + sessionId + "/feedback")
                            .header("Authorization", "Bearer " + supporterAToken)
                            .contentType(MediaType.APPLICATION_JSON)
                            .content("{\"body\":\"Solid on system design.\"}"))
                    .andExpect(status().isCreated())
                    .andExpect(jsonPath("$.isSubmitted").value(false))
                    .andExpect(jsonPath("$.submittedAt").doesNotExist());
        }

        @Test
        @DisplayName("duplicate draft for the same session returns 409")
        void duplicateDraftReturns409() throws Exception {
            UUID sessionId = freshSessionForSupporterA();
            createDraft(sessionId, supporterAToken, "First pass.");

            mockMvc.perform(post("/sessions/" + sessionId + "/feedback")
                            .header("Authorization", "Bearer " + supporterAToken)
                            .contentType(MediaType.APPLICATION_JSON)
                            .content("{\"body\":\"Second pass.\"}"))
                    .andExpect(status().isConflict());
        }

        @Test
        @DisplayName("non-assigned supporter cannot create feedback for the session")
        void nonAssignedSupporterCannotCreate() throws Exception {
            UUID sessionId = freshSessionForSupporterA();

            mockMvc.perform(post("/sessions/" + sessionId + "/feedback")
                            .header("Authorization", "Bearer " + supporterBToken)
                            .contentType(MediaType.APPLICATION_JSON)
                            .content("{\"body\":\"Should not be allowed.\"}"))
                    .andExpect(status().isForbidden());
        }

        @Test
        @DisplayName("admin cannot create feedback")
        void adminCannotCreate() throws Exception {
            UUID sessionId = freshSessionForSupporterA();

            mockMvc.perform(post("/sessions/" + sessionId + "/feedback")
                            .header("Authorization", "Bearer " + adminToken)
                            .contentType(MediaType.APPLICATION_JSON)
                            .content("{\"body\":\"Should not be allowed.\"}"))
                    .andExpect(status().isForbidden());
        }
    }

    @Nested
    @DisplayName("GET /sessions/:id/feedback — view all")
    class Read {

        @Test
        @DisplayName("another supporter can read feedback they didn't author")
        void anotherSupporterCanReadFeedback() throws Exception {
            UUID sessionId = freshSessionForSupporterA();
            createDraft(sessionId, supporterAToken, "Strong communicator.");

            mockMvc.perform(get("/sessions/" + sessionId + "/feedback")
                            .header("Authorization", "Bearer " + supporterBToken))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.body").value("Strong communicator."))
                    .andExpect(jsonPath("$.supporterId").value(supporterAId.toString()));
        }

        @Test
        @DisplayName("admin and marketer can read feedback")
        void adminAndMarketerCanRead() throws Exception {
            UUID sessionId = freshSessionForSupporterA();
            createDraft(sessionId, supporterAToken, "Good candidate.");

            mockMvc.perform(get("/sessions/" + sessionId + "/feedback")
                            .header("Authorization", "Bearer " + adminToken))
                    .andExpect(status().isOk());

            mockMvc.perform(get("/sessions/" + sessionId + "/feedback")
                            .header("Authorization", "Bearer " + marketerToken))
                    .andExpect(status().isOk());
        }

        @Test
        @DisplayName("candidate cannot read feedback")
        void candidateCannotRead() throws Exception {
            UUID sessionId = freshSessionForSupporterA();
            createDraft(sessionId, supporterAToken, "Good candidate.");

            mockMvc.perform(get("/sessions/" + sessionId + "/feedback")
                            .header("Authorization", "Bearer " + candidateToken))
                    .andExpect(status().isForbidden());
        }

        @Test
        @DisplayName("no feedback record returns 404")
        void noFeedbackReturns404() throws Exception {
            UUID sessionId = freshSessionForSupporterA();

            mockMvc.perform(get("/sessions/" + sessionId + "/feedback")
                            .header("Authorization", "Bearer " + adminToken))
                    .andExpect(status().isNotFound());
        }
    }

    @Nested
    @DisplayName("PATCH /sessions/:id/feedback — edit own only")
    class Update {

        @Test
        @DisplayName("authoring supporter can update the draft body")
        void authoringSupporterCanUpdateDraft() throws Exception {
            UUID sessionId = freshSessionForSupporterA();
            createDraft(sessionId, supporterAToken, "Initial thoughts.");

            mockMvc.perform(patch("/sessions/" + sessionId + "/feedback")
                            .header("Authorization", "Bearer " + supporterAToken)
                            .contentType(MediaType.APPLICATION_JSON)
                            .content("{\"body\":\"Revised thoughts.\"}"))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.body").value("Revised thoughts."))
                    .andExpect(jsonPath("$.isSubmitted").value(false));
        }

        @Test
        @DisplayName("submitting sets isSubmitted and submittedAt, and locks the record")
        void submittingLocksTheRecord() throws Exception {
            UUID sessionId = freshSessionForSupporterA();
            createDraft(sessionId, supporterAToken, "Final feedback.");

            mockMvc.perform(patch("/sessions/" + sessionId + "/feedback")
                            .header("Authorization", "Bearer " + supporterAToken)
                            .contentType(MediaType.APPLICATION_JSON)
                            .content("{\"isSubmitted\":true}"))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.isSubmitted").value(true))
                    .andExpect(jsonPath("$.submittedAt").isNotEmpty());

            mockMvc.perform(patch("/sessions/" + sessionId + "/feedback")
                            .header("Authorization", "Bearer " + supporterAToken)
                            .contentType(MediaType.APPLICATION_JSON)
                            .content("{\"body\":\"Trying to edit after submit.\"}"))
                    .andExpect(status().isConflict());
        }

        @Test
        @DisplayName("a different supporter cannot update someone else's feedback")
        void differentSupporterCannotUpdate() throws Exception {
            UUID sessionId = freshSessionForSupporterA();
            createDraft(sessionId, supporterAToken, "Owned by supporter A.");

            mockMvc.perform(patch("/sessions/" + sessionId + "/feedback")
                            .header("Authorization", "Bearer " + supporterBToken)
                            .contentType(MediaType.APPLICATION_JSON)
                            .content("{\"body\":\"Attempted takeover.\"}"))
                    .andExpect(status().isForbidden());
        }

        @Test
        @DisplayName("admin and marketer cannot update feedback")
        void adminAndMarketerCannotUpdate() throws Exception {
            UUID sessionId = freshSessionForSupporterA();
            createDraft(sessionId, supporterAToken, "Owned by supporter A.");

            mockMvc.perform(patch("/sessions/" + sessionId + "/feedback")
                            .header("Authorization", "Bearer " + adminToken)
                            .contentType(MediaType.APPLICATION_JSON)
                            .content("{\"body\":\"Admin edit attempt.\"}"))
                    .andExpect(status().isForbidden());
        }
    }
}
