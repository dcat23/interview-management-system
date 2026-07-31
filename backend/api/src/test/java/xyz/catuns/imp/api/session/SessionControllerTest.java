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

import static org.assertj.core.api.Assertions.assertThat;
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
        @DisplayName("supporter sees all sessions for process, not just their own")
        void supporterSeesAllSessions() throws Exception {
            mockMvc.perform(get("/processes/" + candidate1ProcessId + "/sessions")
                            .header("Authorization", "Bearer " + supporter1Token))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.length()").value(org.hamcrest.Matchers.greaterThanOrEqualTo(2)))
                    .andExpect(jsonPath("$[*].supporterId",
                            org.hamcrest.Matchers.hasItem(supporter2Id.toString())));
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
    @DisplayName("GET /sessions")
    class ListSessions {

        private UUID searchFixtureSessionId;
        private UUID pastScheduledSessionId;

        @BeforeEach
        void seedSearchFixtures() {
            InterviewSession session = sessionRepository.findByProcessIdOrderByRound(candidate1ProcessId).stream()
                    .filter(s -> "Search-Fixture-Round".equalsIgnoreCase(s.getRound()))
                    .findFirst()
                    .orElseGet(() -> {
                        InterviewSession fixture = new InterviewSession();
                        fixture.setProcessId(candidate1ProcessId);
                        fixture.setSupporterId(supporter1Id);
                        fixture.setRound("Search-Fixture-Round");
                        fixture.setMode("Distinctive-Search-Mode");
                        fixture.setDurationMinutes(30);
                        fixture.setScheduledAt(Instant.now().plus(60, ChronoUnit.DAYS));
                        return sessionRepository.save(fixture);
                    });
            searchFixtureSessionId = session.getId();

            InterviewSession pastSession = sessionRepository.findByProcessIdOrderByRound(candidate1ProcessId).stream()
                    .filter(s -> "DateRange-Fixture-Round".equalsIgnoreCase(s.getRound()))
                    .findFirst()
                    .orElseGet(() -> {
                        InterviewSession fixture = new InterviewSession();
                        fixture.setProcessId(candidate1ProcessId);
                        fixture.setSupporterId(supporter1Id);
                        fixture.setRound("DateRange-Fixture-Round");
                        fixture.setMode("Video");
                        fixture.setDurationMinutes(30);
                        fixture.setScheduledAt(Instant.parse("2020-01-15T12:00:00Z"));
                        return sessionRepository.save(fixture);
                    });
            pastScheduledSessionId = pastSession.getId();
        }

        @Test
        @DisplayName("filters by scheduledAt date range")
        void filtersByScheduledAtRange() throws Exception {
            mockMvc.perform(get("/sessions")
                            .param("scheduledFrom", "2020-01-01")
                            .param("scheduledTo", "2020-01-31")
                            .header("Authorization", "Bearer " + adminToken))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.data[*].id",
                            org.hamcrest.Matchers.hasItem(pastScheduledSessionId.toString())))
                    .andExpect(jsonPath("$.data[*].id",
                            org.hamcrest.Matchers.not(org.hamcrest.Matchers.hasItem(searchFixtureSessionId.toString()))));
        }

        @Test
        @DisplayName("scheduledTo is inclusive of the whole day")
        void scheduledToIsInclusiveOfWholeDay() throws Exception {
            mockMvc.perform(get("/sessions")
                            .param("scheduledFrom", "2020-01-15")
                            .param("scheduledTo", "2020-01-15")
                            .header("Authorization", "Bearer " + adminToken))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.data[*].id",
                            org.hamcrest.Matchers.hasItem(pastScheduledSessionId.toString())));
        }

        @Test
        @DisplayName("scheduledFrom after scheduledTo → 400")
        void invalidScheduledRangeReturns400() throws Exception {
            mockMvc.perform(get("/sessions")
                            .param("scheduledFrom", "2025-01-01")
                            .param("scheduledTo", "2020-01-01")
                            .header("Authorization", "Bearer " + adminToken))
                    .andExpect(status().isBadRequest());
        }

        @Test
        @DisplayName("search matches round")
        void searchMatchesRound() throws Exception {
            mockMvc.perform(get("/sessions")
                            .param("search", "Search-Fixture-Round")
                            .header("Authorization", "Bearer " + adminToken))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.data[*].id",
                            org.hamcrest.Matchers.hasItem(searchFixtureSessionId.toString())));
        }

        @Test
        @DisplayName("search matches mode")
        void searchMatchesMode() throws Exception {
            mockMvc.perform(get("/sessions")
                            .param("search", "Distinctive-Search-Mode")
                            .header("Authorization", "Bearer " + adminToken))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.data[*].id",
                            org.hamcrest.Matchers.hasItem(searchFixtureSessionId.toString())));
        }

        @Test
        @DisplayName("unsortable field → 400")
        void unsortableFieldReturns400() throws Exception {
            mockMvc.perform(get("/sessions")
                            .param("sort", "processId,asc")
                            .header("Authorization", "Bearer " + adminToken))
                    .andExpect(status().isBadRequest());
        }

        @Test
        @DisplayName("admin lists sessions across all processes, paginated")
        void adminListsAll() throws Exception {
            mockMvc.perform(get("/sessions")
                            .header("Authorization", "Bearer " + adminToken))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.data").isArray())
                    .andExpect(jsonPath("$.total").value(org.hamcrest.Matchers.greaterThanOrEqualTo(3)))
                    .andExpect(jsonPath("$.page").value(0))
                    .andExpect(jsonPath("$.limit").exists());
        }

        @Test
        @DisplayName("marketer lists sessions across all processes")
        void marketerListsAll() throws Exception {
            mockMvc.perform(get("/sessions")
                            .header("Authorization", "Bearer " + marketerToken))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.total").value(org.hamcrest.Matchers.greaterThanOrEqualTo(3)));
        }

        @Test
        @DisplayName("supporter lists sessions across all processes, not just their own")
        void supporterListsAll() throws Exception {
            mockMvc.perform(get("/sessions")
                            .header("Authorization", "Bearer " + supporter1Token))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.data[*].supporterId",
                            org.hamcrest.Matchers.hasItem(supporter2Id.toString())));
        }

        @Test
        @DisplayName("candidate cannot list sessions → 403")
        void candidateCannotList() throws Exception {
            mockMvc.perform(get("/sessions")
                            .header("Authorization", "Bearer " + candidate1Token))
                    .andExpect(status().isForbidden());
        }

        @Test
        @DisplayName("filters by processId")
        void filtersByProcessId() throws Exception {
            mockMvc.perform(get("/sessions")
                            .param("processId", candidate1ProcessId.toString())
                            .header("Authorization", "Bearer " + adminToken))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.data[*].processId",
                            org.hamcrest.Matchers.everyItem(org.hamcrest.Matchers.is(candidate1ProcessId.toString()))));
        }

        @Test
        @DisplayName("filters by supporterId")
        void filtersBySupporterId() throws Exception {
            mockMvc.perform(get("/sessions")
                            .param("supporterId", supporter2Id.toString())
                            .header("Authorization", "Bearer " + adminToken))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.data[*].supporterId",
                            org.hamcrest.Matchers.everyItem(org.hamcrest.Matchers.is(supporter2Id.toString()))));
        }

        @Test
        @DisplayName("filters by status")
        void filtersByStatus() throws Exception {
            mockMvc.perform(get("/sessions")
                            .param("status", "SCHEDULED")
                            .header("Authorization", "Bearer " + adminToken))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.data[*].status",
                            org.hamcrest.Matchers.everyItem(org.hamcrest.Matchers.is("SCHEDULED"))));
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
        @DisplayName("supporter can get another supporter's session")
        void supporterCanGetOtherSupportersSession() throws Exception {
            mockMvc.perform(get("/sessions/" + sessionForCandidate1Supporter2)
                            .header("Authorization", "Bearer " + supporter1Token))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.supporterId").value(supporter2Id.toString()));
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

    @Nested
    @DisplayName("process.startedAt sync")
    class ProcessStartedAtSync {

        @Test
        @DisplayName("creating the first session for a process sets startedAt to its scheduledAt")
        void firstSessionSetsStartedAt() throws Exception {
            UUID processId = seedProcess(candidate1ProcessCandidateId(), clientIdOf(candidate1ProcessId), marketerId, "Sync-First").getId();
            Instant scheduledAt = Instant.now().plus(30, ChronoUnit.DAYS).truncatedTo(ChronoUnit.MILLIS);
            CreateSessionRequest request = new CreateSessionRequest(
                    supporter1Id, "Round 1", "Video", 60, null, scheduledAt);

            mockMvc.perform(post("/processes/" + processId + "/sessions")
                            .header("Authorization", "Bearer " + marketerToken)
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(objectMapper.writeValueAsString(request)))
                    .andExpect(status().isCreated());

            InterviewProcess process = processRepository.findById(processId).orElseThrow();
            assertThat(process.getStartedAt()).isEqualTo(scheduledAt);
        }

        @Test
        @DisplayName("adding an earlier session moves startedAt backward")
        void earlierSessionMovesStartedAtBackward() throws Exception {
            UUID processId = seedProcess(candidate1ProcessCandidateId(), clientIdOf(candidate1ProcessId), marketerId, "Sync-Earlier").getId();
            Instant laterScheduledAt = Instant.now().plus(30, ChronoUnit.DAYS).truncatedTo(ChronoUnit.MILLIS);
            Instant earlierScheduledAt = Instant.now().plus(10, ChronoUnit.DAYS).truncatedTo(ChronoUnit.MILLIS);

            mockMvc.perform(post("/processes/" + processId + "/sessions")
                            .header("Authorization", "Bearer " + marketerToken)
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(objectMapper.writeValueAsString(new CreateSessionRequest(
                                    supporter1Id, "Round 1", "Video", 60, null, laterScheduledAt))))
                    .andExpect(status().isCreated());

            mockMvc.perform(post("/processes/" + processId + "/sessions")
                            .header("Authorization", "Bearer " + marketerToken)
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(objectMapper.writeValueAsString(new CreateSessionRequest(
                                    supporter2Id, "Round 2", "Video", 60, null, earlierScheduledAt))))
                    .andExpect(status().isCreated());

            InterviewProcess process = processRepository.findById(processId).orElseThrow();
            assertThat(process.getStartedAt()).isEqualTo(earlierScheduledAt);
        }

        @Test
        @DisplayName("rescheduling a session earlier corrects startedAt")
        void reschedulingEarlierCorrectsStartedAt() throws Exception {
            UUID processId = seedProcess(candidate1ProcessCandidateId(), clientIdOf(candidate1ProcessId), marketerId, "Sync-Reschedule").getId();
            Instant originalScheduledAt = Instant.now().plus(30, ChronoUnit.DAYS).truncatedTo(ChronoUnit.MILLIS);

            String response = mockMvc.perform(post("/processes/" + processId + "/sessions")
                            .header("Authorization", "Bearer " + marketerToken)
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(objectMapper.writeValueAsString(new CreateSessionRequest(
                                    supporter1Id, "Round 1", "Video", 60, null, originalScheduledAt))))
                    .andExpect(status().isCreated())
                    .andReturn().getResponse().getContentAsString();
            UUID sessionId = UUID.fromString(objectMapper.readTree(response).get("id").asText());

            Instant rescheduledAt = Instant.now().plus(5, ChronoUnit.DAYS).truncatedTo(ChronoUnit.MILLIS);
            mockMvc.perform(patch("/sessions/" + sessionId)
                            .header("Authorization", "Bearer " + marketerToken)
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(objectMapper.writeValueAsString(
                                    new UpdateSessionRequest(null, null, null, null, null, rescheduledAt))))
                    .andExpect(status().isOk());

            InterviewProcess process = processRepository.findById(processId).orElseThrow();
            assertThat(process.getStartedAt()).isEqualTo(rescheduledAt);
        }

        private UUID candidate1ProcessCandidateId() {
            return processRepository.findById(candidate1ProcessId).orElseThrow().getCandidateId();
        }

        private UUID clientIdOf(UUID processId) {
            return processRepository.findById(processId).orElseThrow().getClientId();
        }
    }
}
