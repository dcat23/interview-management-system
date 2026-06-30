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
import xyz.catuns.imp.api.session.dto.CreateSessionRequest;
import xyz.catuns.imp.api.session.dto.UpdateSessionRequest;
import xyz.catuns.imp.api.session.entity.InterviewSession;
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
class SessionControllerTest {

    @Autowired MockMvc mockMvc;
    @Autowired ObjectMapper objectMapper;
    @Autowired UserRepository userRepository;
    @Autowired ClientRepository clientRepository;
    @Autowired InterviewProcessRepository processRepository;
    @Autowired InterviewSessionRepository sessionRepository;
    @Autowired PasswordEncoder passwordEncoder;

    private static final String ADMIN_EMAIL       = "sess-admin@example.com";
    private static final String ADMIN_PASSWORD    = "AdminPassword123!";
    private static final String MARKETER_EMAIL    = "sess-marketer@example.com";
    private static final String MARKETER_PASSWORD = "MarketerPass123!";
    private static final String SUPPORTER1_EMAIL    = "sess-supporter1@example.com";
    private static final String SUPPORTER1_PASSWORD = "SupporterPass123!";
    private static final String SUPPORTER2_EMAIL    = "sess-supporter2@example.com";
    private static final String SUPPORTER2_PASSWORD = "SupporterPass456!";
    private static final String CANDIDATE1_EMAIL    = "sess-candidate1@example.com";
    private static final String CANDIDATE1_PASSWORD = "CandidatePass123!";
    private static final String CANDIDATE2_EMAIL    = "sess-candidate2@example.com";
    private static final String CANDIDATE2_PASSWORD = "CandidatePass456!";

    private String adminToken;
    private String marketerToken;
    private String supporter1Token;
    private String supporter2Token;
    private String candidate1Token;
    private String candidate2Token;

    private UUID marketerId;
    private UUID supporter1Id;
    private UUID supporter2Id;
    private UUID candidate1ProcessId;
    private UUID candidate2ProcessId;
    private UUID sessionForCandidate1;
    private UUID sessionForCandidate1Supporter2;
    private UUID sessionForCandidate2;

    @BeforeEach
    void setup() throws Exception {
        UUID adminId      = seedUser(ADMIN_EMAIL,      "Sess Admin",      ADMIN_PASSWORD,      UserRole.ADMIN).getId();
        marketerId        = seedUser(MARKETER_EMAIL,   "Sess Marketer",   MARKETER_PASSWORD,   UserRole.MARKETER).getId();
        supporter1Id      = seedUser(SUPPORTER1_EMAIL, "Sess Supporter1", SUPPORTER1_PASSWORD, UserRole.SUPPORTER).getId();
        supporter2Id      = seedUser(SUPPORTER2_EMAIL, "Sess Supporter2", SUPPORTER2_PASSWORD, UserRole.SUPPORTER).getId();
        UUID candidate1Id = seedUser(CANDIDATE1_EMAIL, "Sess Candidate1", CANDIDATE1_PASSWORD, UserRole.CANDIDATE).getId();
        UUID candidate2Id = seedUser(CANDIDATE2_EMAIL, "Sess Candidate2", CANDIDATE2_PASSWORD, UserRole.CANDIDATE).getId();

        adminToken      = login(ADMIN_EMAIL,      ADMIN_PASSWORD);
        marketerToken   = login(MARKETER_EMAIL,   MARKETER_PASSWORD);
        supporter1Token = login(SUPPORTER1_EMAIL, SUPPORTER1_PASSWORD);
        supporter2Token = login(SUPPORTER2_EMAIL, SUPPORTER2_PASSWORD);
        candidate1Token = login(CANDIDATE1_EMAIL, CANDIDATE1_PASSWORD);
        candidate2Token = login(CANDIDATE2_EMAIL, CANDIDATE2_PASSWORD);

        UUID clientId = seedClient("Session Test Corp", "Finance").getId();
        candidate1ProcessId = seedProcess(candidate1Id, clientId, marketerId, "Java").getId();
        candidate2ProcessId = seedProcess(candidate2Id, clientId, marketerId, "Python").getId();

        sessionForCandidate1          = seedSession(candidate1ProcessId, supporter1Id, "Round 1").getId();
        sessionForCandidate1Supporter2 = seedSession(candidate1ProcessId, supporter2Id, "Round 2").getId();
        sessionForCandidate2          = seedSession(candidate2ProcessId, supporter1Id, "Round 1").getId();
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

    private InterviewSession seedSession(UUID processId, UUID supporterId, String round) {
        return sessionRepository.findByProcessIdOrderByRound(processId).stream()
                .filter(s -> s.getSupporterId().equals(supporterId) && s.getRound().equals(round))
                .findFirst()
                .orElseGet(() -> {
                    InterviewSession session = new InterviewSession();
                    session.setProcessId(processId);
                    session.setSupporterId(supporterId);
                    session.setRound(round);
                    session.setMode("Video");
                    session.setDurationMinutes(60);
                    session.setScheduledAt(Instant.now().plus(7, ChronoUnit.DAYS));
                    return sessionRepository.save(session);
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
    @DisplayName("POST /processes/{processId}/sessions")
    class CreateSession {

        @Test
        @DisplayName("marketer creates session → 201 with SCHEDULED status")
        void marketerCanCreate() throws Exception {
            CreateSessionRequest request = new CreateSessionRequest(
                    supporter1Id, "Round 3", "Video", 45, null,
                    Instant.now().plus(14, ChronoUnit.DAYS));

            mockMvc.perform(post("/processes/" + candidate1ProcessId + "/sessions")
                            .header("Authorization", "Bearer " + marketerToken)
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(objectMapper.writeValueAsString(request)))
                    .andExpect(status().isCreated())
                    .andExpect(jsonPath("$.status").value("SCHEDULED"))
                    .andExpect(jsonPath("$.round").value("Round 3"))
                    .andExpect(jsonPath("$.processId").value(candidate1ProcessId.toString()));
        }

        @Test
        @DisplayName("admin creates session → 201")
        void adminCanCreate() throws Exception {
            CreateSessionRequest request = new CreateSessionRequest(
                    supporter2Id, "Round 4", "In-Person", 90, "Technical",
                    Instant.now().plus(10, ChronoUnit.DAYS));

            mockMvc.perform(post("/processes/" + candidate1ProcessId + "/sessions")
                            .header("Authorization", "Bearer " + adminToken)
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(objectMapper.writeValueAsString(request)))
                    .andExpect(status().isCreated())
                    .andExpect(jsonPath("$.durationMinutes").value(90));
        }

        @Test
        @DisplayName("supporter cannot create → 403")
        void supporterCannotCreate() throws Exception {
            CreateSessionRequest request = new CreateSessionRequest(
                    supporter1Id, "Round 5", "Video", 60, null,
                    Instant.now().plus(7, ChronoUnit.DAYS));

            mockMvc.perform(post("/processes/" + candidate1ProcessId + "/sessions")
                            .header("Authorization", "Bearer " + supporter1Token)
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(objectMapper.writeValueAsString(request)))
                    .andExpect(status().isForbidden());
        }

        @Test
        @DisplayName("candidate cannot create → 403")
        void candidateCannotCreate() throws Exception {
            CreateSessionRequest request = new CreateSessionRequest(
                    supporter1Id, "Round 5", "Video", 60, null,
                    Instant.now().plus(7, ChronoUnit.DAYS));

            mockMvc.perform(post("/processes/" + candidate1ProcessId + "/sessions")
                            .header("Authorization", "Bearer " + candidate1Token)
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(objectMapper.writeValueAsString(request)))
                    .andExpect(status().isForbidden());
        }

        @Test
        @DisplayName("non-existent process → 404")
        void nonExistentProcessReturns404() throws Exception {
            CreateSessionRequest request = new CreateSessionRequest(
                    supporter1Id, "Round 1", "Video", 60, null,
                    Instant.now().plus(7, ChronoUnit.DAYS));

            mockMvc.perform(post("/processes/" + UUID.randomUUID() + "/sessions")
                            .header("Authorization", "Bearer " + marketerToken)
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(objectMapper.writeValueAsString(request)))
                    .andExpect(status().isNotFound());
        }

        @Test
        @DisplayName("missing supporterId → 400")
        void missingSupporterIdReturns400() throws Exception {
            mockMvc.perform(post("/processes/" + candidate1ProcessId + "/sessions")
                            .header("Authorization", "Bearer " + marketerToken)
                            .contentType(MediaType.APPLICATION_JSON)
                            .content("{\"round\":\"Round 1\",\"mode\":\"Video\",\"durationMinutes\":60,\"scheduledAt\":\"2026-12-01T10:00:00Z\"}"))
                    .andExpect(status().isBadRequest());
        }

        @Test
        @DisplayName("zero durationMinutes → 400")
        void zeroDurationReturns400() throws Exception {
            CreateSessionRequest request = new CreateSessionRequest(
                    supporter1Id, "Round 1", "Video", 0, null,
                    Instant.now().plus(7, ChronoUnit.DAYS));

            mockMvc.perform(post("/processes/" + candidate1ProcessId + "/sessions")
                            .header("Authorization", "Bearer " + marketerToken)
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(objectMapper.writeValueAsString(request)))
                    .andExpect(status().isBadRequest());
        }
    }

    @Nested
    @DisplayName("GET /processes/{processId}/sessions")
    class ListSessionsByProcess {

        @Test
        @DisplayName("admin sees all sessions for process")
        void adminSeesAll() throws Exception {
            mockMvc.perform(get("/processes/" + candidate1ProcessId + "/sessions")
                            .header("Authorization", "Bearer " + adminToken))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.length()").value(org.hamcrest.Matchers.greaterThanOrEqualTo(2)));
        }

        @Test
        @DisplayName("marketer sees all sessions for process")
        void marketerSeesAll() throws Exception {
            mockMvc.perform(get("/processes/" + candidate1ProcessId + "/sessions")
                            .header("Authorization", "Bearer " + marketerToken))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.length()").value(org.hamcrest.Matchers.greaterThanOrEqualTo(2)));
        }

        @Test
        @DisplayName("supporter sees only their assigned sessions")
        void supporterSeesOwnSessions() throws Exception {
            mockMvc.perform(get("/processes/" + candidate1ProcessId + "/sessions")
                            .header("Authorization", "Bearer " + supporter1Token))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$[*].supporterId",
                            org.hamcrest.Matchers.everyItem(org.hamcrest.Matchers.is(supporter1Id.toString()))));
        }

        @Test
        @DisplayName("candidate sees sessions for their own process")
        void candidateSeesOwnProcessSessions() throws Exception {
            mockMvc.perform(get("/processes/" + candidate1ProcessId + "/sessions")
                            .header("Authorization", "Bearer " + candidate1Token))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$[*].processId",
                            org.hamcrest.Matchers.everyItem(org.hamcrest.Matchers.is(candidate1ProcessId.toString()))));
        }

        @Test
        @DisplayName("candidate cannot list sessions for another candidate's process → 403")
        void candidateCannotAccessOtherProcess() throws Exception {
            mockMvc.perform(get("/processes/" + candidate2ProcessId + "/sessions")
                            .header("Authorization", "Bearer " + candidate1Token))
                    .andExpect(status().isForbidden());
        }

        @Test
        @DisplayName("non-existent process → 404")
        void nonExistentProcessReturns404() throws Exception {
            mockMvc.perform(get("/processes/" + UUID.randomUUID() + "/sessions")
                            .header("Authorization", "Bearer " + adminToken))
                    .andExpect(status().isNotFound());
        }
    }

    @Nested
    @DisplayName("GET /sessions/{id}")
    class GetSessionById {

        @Test
        @DisplayName("admin can get any session")
        void adminCanGet() throws Exception {
            mockMvc.perform(get("/sessions/" + sessionForCandidate1)
                            .header("Authorization", "Bearer " + adminToken))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.id").value(sessionForCandidate1.toString()));
        }

        @Test
        @DisplayName("marketer can get any session")
        void marketerCanGet() throws Exception {
            mockMvc.perform(get("/sessions/" + sessionForCandidate1)
                            .header("Authorization", "Bearer " + marketerToken))
                    .andExpect(status().isOk());
        }

        @Test
        @DisplayName("supporter can get their assigned session")
        void supporterCanGetOwnSession() throws Exception {
            mockMvc.perform(get("/sessions/" + sessionForCandidate1)
                            .header("Authorization", "Bearer " + supporter1Token))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.supporterId").value(supporter1Id.toString()));
        }

        @Test
        @DisplayName("supporter cannot get another supporter's session → 403")
        void supporterCannotGetOtherSession() throws Exception {
            mockMvc.perform(get("/sessions/" + sessionForCandidate1Supporter2)
                            .header("Authorization", "Bearer " + supporter1Token))
                    .andExpect(status().isForbidden());
        }

        @Test
        @DisplayName("candidate can get session belonging to their process")
        void candidateCanGetOwnProcessSession() throws Exception {
            mockMvc.perform(get("/sessions/" + sessionForCandidate1)
                            .header("Authorization", "Bearer " + candidate1Token))
                    .andExpect(status().isOk());
        }

        @Test
        @DisplayName("candidate cannot get session from another candidate's process → 403")
        void candidateCannotGetOtherProcessSession() throws Exception {
            mockMvc.perform(get("/sessions/" + sessionForCandidate2)
                            .header("Authorization", "Bearer " + candidate1Token))
                    .andExpect(status().isForbidden());
        }

        @Test
        @DisplayName("non-existent session → 404")
        void nonExistentSessionReturns404() throws Exception {
            mockMvc.perform(get("/sessions/" + UUID.randomUUID())
                            .header("Authorization", "Bearer " + adminToken))
                    .andExpect(status().isNotFound());
        }
    }

    @Nested
    @DisplayName("PATCH /sessions/{id}")
    class UpdateSession {

        @Test
        @DisplayName("marketer can update round")
        void marketerCanUpdate() throws Exception {
            UpdateSessionRequest request = new UpdateSessionRequest(null, "Round Updated", null, null, null, null);

            mockMvc.perform(patch("/sessions/" + sessionForCandidate1)
                            .header("Authorization", "Bearer " + marketerToken)
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(objectMapper.writeValueAsString(request)))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.round").value("Round Updated"));
        }

        @Test
        @DisplayName("admin can update mode and duration")
        void adminCanUpdate() throws Exception {
            UpdateSessionRequest request = new UpdateSessionRequest(null, null, "In-Person", 120, null, null);

            mockMvc.perform(patch("/sessions/" + sessionForCandidate1)
                            .header("Authorization", "Bearer " + adminToken)
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(objectMapper.writeValueAsString(request)))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.mode").value("In-Person"))
                    .andExpect(jsonPath("$.durationMinutes").value(120));
        }

        @Test
        @DisplayName("supporter cannot update → 403")
        void supporterCannotUpdate() throws Exception {
            UpdateSessionRequest request = new UpdateSessionRequest(null, "Hacked Round", null, null, null, null);

            mockMvc.perform(patch("/sessions/" + sessionForCandidate1)
                            .header("Authorization", "Bearer " + supporter1Token)
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(objectMapper.writeValueAsString(request)))
                    .andExpect(status().isForbidden());
        }

        @Test
        @DisplayName("candidate cannot update → 403")
        void candidateCannotUpdate() throws Exception {
            UpdateSessionRequest request = new UpdateSessionRequest(null, "Hacked Round", null, null, null, null);

            mockMvc.perform(patch("/sessions/" + sessionForCandidate1)
                            .header("Authorization", "Bearer " + candidate1Token)
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(objectMapper.writeValueAsString(request)))
                    .andExpect(status().isForbidden());
        }

        @Test
        @DisplayName("non-existent session → 404")
        void nonExistentSessionReturns404() throws Exception {
            UpdateSessionRequest request = new UpdateSessionRequest(null, "Round X", null, null, null, null);

            mockMvc.perform(patch("/sessions/" + UUID.randomUUID())
                            .header("Authorization", "Bearer " + adminToken)
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(objectMapper.writeValueAsString(request)))
                    .andExpect(status().isNotFound());
        }
    }
}
