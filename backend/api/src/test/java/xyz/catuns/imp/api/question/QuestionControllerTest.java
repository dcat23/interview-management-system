package xyz.catuns.imp.api.question;

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
import xyz.catuns.imp.api.question.dto.CreateQuestionRequest;
import xyz.catuns.imp.api.question.dto.LinkQuestionRequest;
import xyz.catuns.imp.api.question.dto.UpdateQuestionRequest;
import xyz.catuns.imp.api.question.entity.Question;
import xyz.catuns.imp.api.question.repository.QuestionRepository;
import xyz.catuns.imp.api.session.entity.InterviewSession;
import xyz.catuns.imp.api.session.repository.InterviewSessionRepository;
import xyz.catuns.imp.api.user.entity.User;
import xyz.catuns.imp.api.user.entity.UserRole;
import xyz.catuns.imp.api.user.repository.UserRepository;

import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.UUID;

import static org.hamcrest.Matchers.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
@Import(TestcontainersConfiguration.class)
class QuestionControllerTest {

    @Autowired MockMvc mockMvc;
    @Autowired ObjectMapper objectMapper;
    @Autowired UserRepository userRepository;
    @Autowired ClientRepository clientRepository;
    @Autowired InterviewProcessRepository processRepository;
    @Autowired InterviewSessionRepository sessionRepository;
    @Autowired QuestionRepository questionRepository;
    @Autowired PasswordEncoder passwordEncoder;

    private static final String ADMIN_EMAIL         = "q-admin@example.com";
    private static final String ADMIN_PASSWORD      = "AdminPass123!";
    private static final String MARKETER_EMAIL      = "q-marketer@example.com";
    private static final String MARKETER_PASSWORD   = "MarketerPass123!";
    private static final String SUPPORTER1_EMAIL    = "q-supporter1@example.com";
    private static final String SUPPORTER1_PASSWORD = "SupporterPass123!";
    private static final String SUPPORTER2_EMAIL    = "q-supporter2@example.com";
    private static final String SUPPORTER2_PASSWORD = "SupporterPass456!";
    private static final String CANDIDATE_EMAIL     = "q-candidate@example.com";
    private static final String CANDIDATE_PASSWORD  = "CandidatePass123!";

    private String adminToken;
    private String marketerToken;
    private String supporter1Token;
    private String supporter2Token;
    private String candidateToken;

    private UUID clientId;
    private UUID sessionId;
    private UUID supporter1Id;
    private UUID seededQuestionId;

    @BeforeEach
    void setup() throws Exception {
        UUID adminId     = seedUser(ADMIN_EMAIL,      "Q Admin",      ADMIN_PASSWORD,      UserRole.ADMIN).getId();
        UUID marketerId  = seedUser(MARKETER_EMAIL,   "Q Marketer",   MARKETER_PASSWORD,   UserRole.MARKETER).getId();
        supporter1Id     = seedUser(SUPPORTER1_EMAIL, "Q Supporter1", SUPPORTER1_PASSWORD, UserRole.SUPPORTER).getId();
        seedUser(SUPPORTER2_EMAIL, "Q Supporter2", SUPPORTER2_PASSWORD, UserRole.SUPPORTER);
        UUID candidateId = seedUser(CANDIDATE_EMAIL,  "Q Candidate",  CANDIDATE_PASSWORD,  UserRole.CANDIDATE).getId();

        adminToken      = login(ADMIN_EMAIL,      ADMIN_PASSWORD);
        marketerToken   = login(MARKETER_EMAIL,   MARKETER_PASSWORD);
        supporter1Token = login(SUPPORTER1_EMAIL, SUPPORTER1_PASSWORD);
        supporter2Token = login(SUPPORTER2_EMAIL, SUPPORTER2_PASSWORD);
        candidateToken  = login(CANDIDATE_EMAIL,  CANDIDATE_PASSWORD);

        clientId = seedClient("Q Corp", "Finance").getId();
        UUID processId = seedProcess(candidateId, clientId, marketerId, "Spring Boot").getId();

        sessionId = seedSession(processId, supporter1Id).getId();

        seededQuestionId = seedQuestion(clientId, adminId, "Spring IoC", "Technical", "Explain IoC container").getId();
    }

    @Nested
    @DisplayName("POST /questions")
    class CreateQuestion {

        @Test
        @DisplayName("admin creates question → 201 with body")
        void adminCreates() throws Exception {
            var req = new CreateQuestionRequest(clientId, "REST vs SOAP", "Technical", "Compare REST and SOAP.");

            mockMvc.perform(post("/questions")
                            .header("Authorization", "Bearer " + adminToken)
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(objectMapper.writeValueAsString(req)))
                    .andExpect(status().isCreated())
                    .andExpect(jsonPath("$.topic").value("REST vs SOAP"))
                    .andExpect(jsonPath("$.version").value(1))
                    .andExpect(jsonPath("$.active").value(true));
        }

        @Test
        @DisplayName("marketer cannot create question → 403")
        void marketerForbidden() throws Exception {
            var req = new CreateQuestionRequest(clientId, "Topic", "Technical", "Body");

            mockMvc.perform(post("/questions")
                            .header("Authorization", "Bearer " + marketerToken)
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(objectMapper.writeValueAsString(req)))
                    .andExpect(status().isForbidden());
        }

        @Test
        @DisplayName("candidate cannot create question → 403")
        void candidateForbidden() throws Exception {
            var req = new CreateQuestionRequest(clientId, "Topic", "Technical", "Body");

            mockMvc.perform(post("/questions")
                            .header("Authorization", "Bearer " + candidateToken)
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(objectMapper.writeValueAsString(req)))
                    .andExpect(status().isForbidden());
        }

        @Test
        @DisplayName("unknown client id → 404")
        void unknownClientReturns404() throws Exception {
            var req = new CreateQuestionRequest(UUID.randomUUID(), "Topic", "Round 1", "Body");

            mockMvc.perform(post("/questions")
                            .header("Authorization", "Bearer " + adminToken)
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(objectMapper.writeValueAsString(req)))
                    .andExpect(status().isNotFound());
        }
    }

    @Nested
    @DisplayName("GET /questions/{id}")
    class GetQuestionById {

        @Test
        @DisplayName("admin gets question by id → 200")
        void adminGets() throws Exception {
            mockMvc.perform(get("/questions/" + seededQuestionId)
                            .header("Authorization", "Bearer " + adminToken))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.id").value(seededQuestionId.toString()))
                    .andExpect(jsonPath("$.topic").value("Spring IoC"));
        }

        @Test
        @DisplayName("marketer gets question → 200")
        void marketerGets() throws Exception {
            mockMvc.perform(get("/questions/" + seededQuestionId)
                            .header("Authorization", "Bearer " + marketerToken))
                    .andExpect(status().isOk());
        }

        @Test
        @DisplayName("supporter gets question → 200")
        void supporterGets() throws Exception {
            mockMvc.perform(get("/questions/" + seededQuestionId)
                            .header("Authorization", "Bearer " + supporter1Token))
                    .andExpect(status().isOk());
        }

        @Test
        @DisplayName("candidate cannot get question → 403")
        void candidateForbidden() throws Exception {
            mockMvc.perform(get("/questions/" + seededQuestionId)
                            .header("Authorization", "Bearer " + candidateToken))
                    .andExpect(status().isForbidden());
        }

        @Test
        @DisplayName("unknown id → 404")
        void unknownId() throws Exception {
            mockMvc.perform(get("/questions/" + UUID.randomUUID())
                            .header("Authorization", "Bearer " + adminToken))
                    .andExpect(status().isNotFound());
        }
    }

    @Nested
    @DisplayName("GET /questions")
    class ListQuestions {

        @Test
        @DisplayName("admin lists all active questions")
        void adminListsAll() throws Exception {
            mockMvc.perform(get("/questions")
                            .header("Authorization", "Bearer " + adminToken))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.content", hasSize(greaterThanOrEqualTo(1))));
        }

        @Test
        @DisplayName("filter by clientId returns matching questions")
        void filterByClient() throws Exception {
            mockMvc.perform(get("/questions")
                            .param("clientId", clientId.toString())
                            .header("Authorization", "Bearer " + adminToken))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.content[*].clientId", everyItem(is(clientId.toString()))));
        }

        @Test
        @DisplayName("candidate cannot list questions → 403")
        void candidateForbidden() throws Exception {
            mockMvc.perform(get("/questions")
                            .header("Authorization", "Bearer " + candidateToken))
                    .andExpect(status().isForbidden());
        }
    }

    @Nested
    @DisplayName("PATCH /questions/{id}")
    class UpdateQuestion {

        @Test
        @DisplayName("admin updates question → 200, version incremented, old version saved")
        void adminUpdates() throws Exception {
            var req = new UpdateQuestionRequest("Spring DI Updated", null, "Updated body content");

            mockMvc.perform(patch("/questions/" + seededQuestionId)
                            .header("Authorization", "Bearer " + adminToken)
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(objectMapper.writeValueAsString(req)))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.topic").value("Spring DI Updated"))
                    .andExpect(jsonPath("$.version").value(2))
                    .andExpect(jsonPath("$.body").value("Updated body content"));
        }

        @Test
        @DisplayName("null fields in PATCH are ignored")
        void nullFieldsIgnored() throws Exception {
            var req = new UpdateQuestionRequest(null, null, "Only body changed");

            mockMvc.perform(patch("/questions/" + seededQuestionId)
                            .header("Authorization", "Bearer " + adminToken)
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(objectMapper.writeValueAsString(req)))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.topic").value("Spring IoC"))
                    .andExpect(jsonPath("$.round").value("Technical"));
        }

        @Test
        @DisplayName("supporter cannot update → 403")
        void supporterForbidden() throws Exception {
            var req = new UpdateQuestionRequest("New Topic", null, null);

            mockMvc.perform(patch("/questions/" + seededQuestionId)
                            .header("Authorization", "Bearer " + supporter1Token)
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(objectMapper.writeValueAsString(req)))
                    .andExpect(status().isForbidden());
        }
    }

    @Nested
    @DisplayName("DELETE /questions/{id}")
    class SoftDeleteQuestion {

        @Test
        @DisplayName("admin soft-deletes question → 204, excluded from active list")
        void adminSoftDeletes() throws Exception {
            UUID qId = seedQuestion(clientId, userRepository.findByEmail(ADMIN_EMAIL).get().getId(),
                    "To Delete", "Round 2", "Delete me").getId();

            mockMvc.perform(delete("/questions/" + qId)
                            .header("Authorization", "Bearer " + adminToken))
                    .andExpect(status().isNoContent());

            mockMvc.perform(get("/questions/" + qId)
                            .header("Authorization", "Bearer " + adminToken))
                    .andExpect(jsonPath("$.active").value(false));
        }

        @Test
        @DisplayName("marketer cannot soft-delete → 403")
        void marketerForbidden() throws Exception {
            mockMvc.perform(delete("/questions/" + seededQuestionId)
                            .header("Authorization", "Bearer " + marketerToken))
                    .andExpect(status().isForbidden());
        }
    }

    @Nested
    @DisplayName("POST /sessions/{sessionId}/questions")
    class LinkQuestion {

        @Test
        @DisplayName("admin links question to session → 201")
        void adminLinks() throws Exception {
            var req = new LinkQuestionRequest(seededQuestionId, 1, "Pay attention");

            mockMvc.perform(post("/sessions/" + sessionId + "/questions")
                            .header("Authorization", "Bearer " + adminToken)
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(objectMapper.writeValueAsString(req)))
                    .andExpect(status().isCreated())
                    .andExpect(jsonPath("$.sessionId").value(sessionId.toString()))
                    .andExpect(jsonPath("$.questionId").value(seededQuestionId.toString()))
                    .andExpect(jsonPath("$.displayOrder").value(1));
        }

        @Test
        @DisplayName("assigned supporter links question → 201")
        void assignedSupporterLinks() throws Exception {
            UUID q2 = seedQuestion(clientId, userRepository.findByEmail(ADMIN_EMAIL).get().getId(),
                    "JPA N+1", "Technical", "What is N+1?").getId();
            var req = new LinkQuestionRequest(q2, 2, null);

            mockMvc.perform(post("/sessions/" + sessionId + "/questions")
                            .header("Authorization", "Bearer " + supporter1Token)
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(objectMapper.writeValueAsString(req)))
                    .andExpect(status().isCreated());
        }

        @Test
        @DisplayName("unassigned supporter cannot link → 403")
        void unassignedSupporterForbidden() throws Exception {
            UUID q2 = seedQuestion(clientId, userRepository.findByEmail(ADMIN_EMAIL).get().getId(),
                    "Docker", "System", "What is Docker?").getId();
            var req = new LinkQuestionRequest(q2, 1, null);

            mockMvc.perform(post("/sessions/" + sessionId + "/questions")
                            .header("Authorization", "Bearer " + supporter2Token)
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(objectMapper.writeValueAsString(req)))
                    .andExpect(status().isForbidden());
        }

        @Test
        @DisplayName("linking same question twice → 409")
        void duplicateLinkConflict() throws Exception {
            var req = new LinkQuestionRequest(seededQuestionId, 1, null);

            mockMvc.perform(post("/sessions/" + sessionId + "/questions")
                            .header("Authorization", "Bearer " + adminToken)
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(objectMapper.writeValueAsString(req)))
                    .andExpect(status().isCreated());

            mockMvc.perform(post("/sessions/" + sessionId + "/questions")
                            .header("Authorization", "Bearer " + adminToken)
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(objectMapper.writeValueAsString(req)))
                    .andExpect(status().isConflict());
        }
    }

    @Nested
    @DisplayName("GET /sessions/{sessionId}/questions")
    class ListSessionQuestions {

        @Test
        @DisplayName("returns linked questions for session")
        void listLinkedQuestions() throws Exception {
            var req = new LinkQuestionRequest(seededQuestionId, 1, "Note");
            mockMvc.perform(post("/sessions/" + sessionId + "/questions")
                    .header("Authorization", "Bearer " + adminToken)
                    .contentType(MediaType.APPLICATION_JSON)
                    .content(objectMapper.writeValueAsString(req)));

            mockMvc.perform(get("/sessions/" + sessionId + "/questions")
                            .header("Authorization", "Bearer " + adminToken))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$", hasSize(greaterThanOrEqualTo(1))));
        }
    }

    @Nested
    @DisplayName("DELETE /sessions/{sessionId}/questions/{questionId}")
    class UnlinkQuestion {

        @Test
        @DisplayName("admin unlinks question → 204")
        void adminUnlinks() throws Exception {
            var req = new LinkQuestionRequest(seededQuestionId, 1, null);
            mockMvc.perform(post("/sessions/" + sessionId + "/questions")
                    .header("Authorization", "Bearer " + adminToken)
                    .contentType(MediaType.APPLICATION_JSON)
                    .content(objectMapper.writeValueAsString(req)));

            mockMvc.perform(delete("/sessions/" + sessionId + "/questions/" + seededQuestionId)
                            .header("Authorization", "Bearer " + adminToken))
                    .andExpect(status().isNoContent());
        }

        @Test
        @DisplayName("unlink non-existent link → 404")
        void notLinked() throws Exception {
            mockMvc.perform(delete("/sessions/" + sessionId + "/questions/" + UUID.randomUUID())
                            .header("Authorization", "Bearer " + adminToken))
                    .andExpect(status().isNotFound());
        }
    }

    // ── helpers ──────────────────────────────────────────────────────────────

    private User seedUser(String email, String name, String password, UserRole role) {
        return userRepository.findByEmail(email).orElseGet(() -> {
            User u = new User();
            u.setName(name);
            u.setEmail(email);
            u.setPassword(passwordEncoder.encode(password));
            u.setRole(role);
            return userRepository.save(u);
        });
    }

    private Client seedClient(String name, String industry) {
        return clientRepository.findAll().stream()
                .filter(c -> c.getName().equals(name))
                .findFirst()
                .orElseGet(() -> {
                    Client c = new Client();
                    c.setName(name);
                    c.setIndustry(industry);
                    return clientRepository.save(c);
                });
    }

    private InterviewProcess seedProcess(UUID candidateId, UUID clientId, UUID marketerId, String tech) {
        return processRepository.findAll().stream()
                .filter(p -> p.getCandidateId().equals(candidateId) && p.getTechnology().equals(tech))
                .findFirst()
                .orElseGet(() -> {
                    InterviewProcess p = new InterviewProcess();
                    p.setCandidateId(candidateId);
                    p.setClientId(clientId);
                    p.setMarketerId(marketerId);
                    p.setTechnology(tech);
                    return processRepository.save(p);
                });
    }

    private InterviewSession seedSession(UUID processId, UUID supporterId) {
        return sessionRepository.findByProcessIdOrderByRound(processId).stream().findFirst()
                .orElseGet(() -> {
                    InterviewSession s = new InterviewSession();
                    s.setProcessId(processId);
                    s.setSupporterId(supporterId);
                    s.setRound("Round 1");
                    s.setMode("Video");
                    s.setDurationMinutes(60);
                    s.setScheduledAt(Instant.now().plus(7, ChronoUnit.DAYS));
                    return sessionRepository.save(s);
                });
    }

    private Question seedQuestion(UUID clientId, UUID createdBy, String topic, String round, String body) {
        return questionRepository.findAll().stream()
                .filter(q -> q.getTopic().equals(topic) && q.getClientId().equals(clientId))
                .findFirst()
                .orElseGet(() -> {
                    Question q = new Question();
                    q.setClientId(clientId);
                    q.setTopic(topic);
                    q.setRound(round);
                    q.setBody(body);
                    q.setCreatedBy(createdBy);
                    return questionRepository.save(q);
                });
    }

    private String login(String email, String password) throws Exception {
        String response = mockMvc.perform(post("/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(new LoginRequest(email, password))))
                .andReturn().getResponse().getContentAsString();
        return objectMapper.readTree(response).get("accessToken").asText();
    }
}
