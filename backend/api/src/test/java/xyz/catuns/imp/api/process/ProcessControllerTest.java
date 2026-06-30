package xyz.catuns.imp.api.process;

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
import xyz.catuns.imp.api.process.dto.CreateProcessRequest;
import xyz.catuns.imp.api.process.dto.UpdateProcessRequest;
import xyz.catuns.imp.api.process.entity.InterviewProcess;
import xyz.catuns.imp.api.process.entity.ProcessStatus;
import xyz.catuns.imp.api.process.repository.InterviewProcessRepository;
import xyz.catuns.imp.api.user.entity.User;
import xyz.catuns.imp.api.user.entity.UserRole;
import xyz.catuns.imp.api.user.repository.UserRepository;

import java.util.UUID;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
@Import(TestcontainersConfiguration.class)
class ProcessControllerTest {

    @Autowired MockMvc mockMvc;
    @Autowired ObjectMapper objectMapper;
    @Autowired UserRepository userRepository;
    @Autowired ClientRepository clientRepository;
    @Autowired InterviewProcessRepository processRepository;
    @Autowired PasswordEncoder passwordEncoder;

    private static final String ADMIN_EMAIL    = "proc-admin@example.com";
    private static final String ADMIN_PASSWORD = "AdminPassword123!";
    private static final String MARKETER_EMAIL    = "proc-marketer@example.com";
    private static final String MARKETER_PASSWORD = "MarketerPass123!";
    private static final String SUPPORTER_EMAIL    = "proc-supporter@example.com";
    private static final String SUPPORTER_PASSWORD = "SupporterPass123!";
    private static final String CANDIDATE1_EMAIL    = "proc-candidate1@example.com";
    private static final String CANDIDATE1_PASSWORD = "CandidatePass123!";
    private static final String CANDIDATE2_EMAIL    = "proc-candidate2@example.com";
    private static final String CANDIDATE2_PASSWORD = "CandidatePass456!";

    private String adminToken;
    private String marketerToken;
    private String supporterToken;
    private String candidate1Token;
    private String candidate2Token;

    private UUID adminId;
    private UUID marketerId;
    private UUID candidate1Id;
    private UUID candidate2Id;
    private UUID clientId;
    private UUID ownProcessId;

    @BeforeEach
    void setup() throws Exception {
        adminId     = seedUser(ADMIN_EMAIL,     "Proc Admin",      ADMIN_PASSWORD,      UserRole.ADMIN).getId();
        marketerId  = seedUser(MARKETER_EMAIL,  "Proc Marketer",   MARKETER_PASSWORD,   UserRole.MARKETER).getId();
                      seedUser(SUPPORTER_EMAIL, "Proc Supporter",  SUPPORTER_PASSWORD,  UserRole.SUPPORTER);
        candidate1Id = seedUser(CANDIDATE1_EMAIL, "Proc Candidate1", CANDIDATE1_PASSWORD, UserRole.CANDIDATE).getId();
        candidate2Id = seedUser(CANDIDATE2_EMAIL, "Proc Candidate2", CANDIDATE2_PASSWORD, UserRole.CANDIDATE).getId();

        adminToken      = login(ADMIN_EMAIL,      ADMIN_PASSWORD);
        marketerToken   = login(MARKETER_EMAIL,   MARKETER_PASSWORD);
        supporterToken  = login(SUPPORTER_EMAIL,  SUPPORTER_PASSWORD);
        candidate1Token = login(CANDIDATE1_EMAIL, CANDIDATE1_PASSWORD);
        candidate2Token = login(CANDIDATE2_EMAIL, CANDIDATE2_PASSWORD);

        clientId    = seedClient("Process Test Corp", "Technology").getId();
        ownProcessId = seedProcess(candidate1Id, clientId, marketerId, "Java").getId();
        seedProcess(candidate2Id, clientId, marketerId, "Python");
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
    @DisplayName("POST /processes")
    class CreateProcess {

        @Test
        @DisplayName("marketer creates process → 201 with ACTIVE status")
        void marketerCanCreate() throws Exception {
            CreateProcessRequest request = new CreateProcessRequest(
                    candidate1Id, clientId, marketerId, "Go", null);

            mockMvc.perform(post("/processes")
                            .header("Authorization", "Bearer " + marketerToken)
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(objectMapper.writeValueAsString(request)))
                    .andExpect(status().isCreated())
                    .andExpect(jsonPath("$.technology").value("Go"))
                    .andExpect(jsonPath("$.status").value("ACTIVE"))
                    .andExpect(jsonPath("$.id").isString());
        }

        @Test
        @DisplayName("admin creates process → 201")
        void adminCanCreate() throws Exception {
            CreateProcessRequest request = new CreateProcessRequest(
                    candidate1Id, clientId, adminId, "Kotlin", null);

            mockMvc.perform(post("/processes")
                            .header("Authorization", "Bearer " + adminToken)
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(objectMapper.writeValueAsString(request)))
                    .andExpect(status().isCreated())
                    .andExpect(jsonPath("$.technology").value("Kotlin"));
        }

        @Test
        @DisplayName("supporter cannot create → 403")
        void supporterCannotCreate() throws Exception {
            CreateProcessRequest request = new CreateProcessRequest(
                    candidate1Id, clientId, marketerId, "Rust", null);

            mockMvc.perform(post("/processes")
                            .header("Authorization", "Bearer " + supporterToken)
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(objectMapper.writeValueAsString(request)))
                    .andExpect(status().isForbidden());
        }

        @Test
        @DisplayName("candidate cannot create → 403")
        void candidateCannotCreate() throws Exception {
            CreateProcessRequest request = new CreateProcessRequest(
                    candidate1Id, clientId, marketerId, "Swift", null);

            mockMvc.perform(post("/processes")
                            .header("Authorization", "Bearer " + candidate1Token)
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(objectMapper.writeValueAsString(request)))
                    .andExpect(status().isForbidden());
        }

        @Test
        @DisplayName("missing clientId → 400")
        void missingClientIdReturns400() throws Exception {
            mockMvc.perform(post("/processes")
                            .header("Authorization", "Bearer " + marketerToken)
                            .contentType(MediaType.APPLICATION_JSON)
                            .content("{\"candidateId\":\"" + candidate1Id + "\",\"marketerId\":\"" + marketerId + "\",\"technology\":\"Java\"}"))
                    .andExpect(status().isBadRequest());
        }

        @Test
        @DisplayName("missing technology → 400")
        void missingTechnologyReturns400() throws Exception {
            mockMvc.perform(post("/processes")
                            .header("Authorization", "Bearer " + marketerToken)
                            .contentType(MediaType.APPLICATION_JSON)
                            .content("{\"candidateId\":\"" + candidate1Id + "\",\"clientId\":\"" + clientId + "\",\"marketerId\":\"" + marketerId + "\"}"))
                    .andExpect(status().isBadRequest());
        }

        @Test
        @DisplayName("unauthenticated → 401")
        void unauthenticatedCannotCreate() throws Exception {
            CreateProcessRequest request = new CreateProcessRequest(
                    candidate1Id, clientId, marketerId, "Scala", null);

            mockMvc.perform(post("/processes")
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(objectMapper.writeValueAsString(request)))
                    .andExpect(status().isUnauthorized());
        }
    }

    @Nested
    @DisplayName("GET /processes")
    class ListProcesses {

        @Test
        @DisplayName("admin sees all processes")
        void adminSeesAll() throws Exception {
            mockMvc.perform(get("/processes")
                            .header("Authorization", "Bearer " + adminToken))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.total").value(org.hamcrest.Matchers.greaterThanOrEqualTo(2)))
                    .andExpect(jsonPath("$.data").isArray());
        }

        @Test
        @DisplayName("marketer sees all processes")
        void marketerSeesAll() throws Exception {
            mockMvc.perform(get("/processes")
                            .header("Authorization", "Bearer " + marketerToken))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.total").value(org.hamcrest.Matchers.greaterThanOrEqualTo(2)));
        }

        @Test
        @DisplayName("supporter sees all processes")
        void supporterSeesAll() throws Exception {
            mockMvc.perform(get("/processes")
                            .header("Authorization", "Bearer " + supporterToken))
                    .andExpect(status().isOk());
        }

        @Test
        @DisplayName("candidate sees only own processes")
        void candidateSeesOnlyOwn() throws Exception {
            mockMvc.perform(get("/processes")
                            .header("Authorization", "Bearer " + candidate1Token))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.data[*].candidateId",
                            org.hamcrest.Matchers.everyItem(org.hamcrest.Matchers.is(candidate1Id.toString()))));
        }

        @Test
        @DisplayName("unauthenticated → 401")
        void unauthenticatedCannotList() throws Exception {
            mockMvc.perform(get("/processes"))
                    .andExpect(status().isUnauthorized());
        }
    }

    @Nested
    @DisplayName("GET /processes/{id}")
    class GetProcessById {

        @Test
        @DisplayName("admin can get any process")
        void adminCanGet() throws Exception {
            mockMvc.perform(get("/processes/" + ownProcessId)
                            .header("Authorization", "Bearer " + adminToken))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.id").value(ownProcessId.toString()));
        }

        @Test
        @DisplayName("marketer can get any process")
        void marketerCanGet() throws Exception {
            mockMvc.perform(get("/processes/" + ownProcessId)
                            .header("Authorization", "Bearer " + marketerToken))
                    .andExpect(status().isOk());
        }

        @Test
        @DisplayName("candidate can get their own process")
        void candidateCanGetOwn() throws Exception {
            mockMvc.perform(get("/processes/" + ownProcessId)
                            .header("Authorization", "Bearer " + candidate1Token))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.candidateId").value(candidate1Id.toString()));
        }

        @Test
        @DisplayName("candidate cannot get another candidate's process → 403")
        void candidateCannotGetOthers() throws Exception {
            mockMvc.perform(get("/processes/" + ownProcessId)
                            .header("Authorization", "Bearer " + candidate2Token))
                    .andExpect(status().isForbidden());
        }

        @Test
        @DisplayName("non-existent process → 404")
        void notFoundForMissingProcess() throws Exception {
            mockMvc.perform(get("/processes/" + UUID.randomUUID())
                            .header("Authorization", "Bearer " + adminToken))
                    .andExpect(status().isNotFound());
        }
    }

    @Nested
    @DisplayName("PATCH /processes/{id}")
    class UpdateProcess {

        @Test
        @DisplayName("marketer can update technology")
        void marketerCanUpdate() throws Exception {
            UpdateProcessRequest request = new UpdateProcessRequest("TypeScript", null, null, null);

            mockMvc.perform(patch("/processes/" + ownProcessId)
                            .header("Authorization", "Bearer " + marketerToken)
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(objectMapper.writeValueAsString(request)))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.technology").value("TypeScript"));
        }

        @Test
        @DisplayName("admin can update status")
        void adminCanUpdateStatus() throws Exception {
            UpdateProcessRequest request = new UpdateProcessRequest(null, null, ProcessStatus.COMPLETED, null);

            mockMvc.perform(patch("/processes/" + ownProcessId)
                            .header("Authorization", "Bearer " + adminToken)
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(objectMapper.writeValueAsString(request)))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.status").value("COMPLETED"));
        }

        @Test
        @DisplayName("supporter cannot update → 403")
        void supporterCannotUpdate() throws Exception {
            UpdateProcessRequest request = new UpdateProcessRequest("C++", null, null, null);

            mockMvc.perform(patch("/processes/" + ownProcessId)
                            .header("Authorization", "Bearer " + supporterToken)
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(objectMapper.writeValueAsString(request)))
                    .andExpect(status().isForbidden());
        }

        @Test
        @DisplayName("candidate cannot update → 403")
        void candidateCannotUpdate() throws Exception {
            UpdateProcessRequest request = new UpdateProcessRequest("PHP", null, null, null);

            mockMvc.perform(patch("/processes/" + ownProcessId)
                            .header("Authorization", "Bearer " + candidate1Token)
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(objectMapper.writeValueAsString(request)))
                    .andExpect(status().isForbidden());
        }

        @Test
        @DisplayName("non-existent process → 404")
        void notFoundForMissingProcess() throws Exception {
            UpdateProcessRequest request = new UpdateProcessRequest("Ruby", null, null, null);

            mockMvc.perform(patch("/processes/" + UUID.randomUUID())
                            .header("Authorization", "Bearer " + adminToken)
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(objectMapper.writeValueAsString(request)))
                    .andExpect(status().isNotFound());
        }
    }
}
