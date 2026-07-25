package xyz.catuns.imp.api.user;

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
import xyz.catuns.imp.api.user.entity.User;
import xyz.catuns.imp.api.user.entity.UserRole;
import xyz.catuns.imp.api.user.repository.UserRepository;

import java.util.UUID;

import static org.hamcrest.Matchers.hasItem;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
@Import(TestcontainersConfiguration.class)
class CandidateControllerTest {

    @Autowired MockMvc mockMvc;
    @Autowired ObjectMapper objectMapper;
    @Autowired UserRepository userRepository;
    @Autowired PasswordEncoder passwordEncoder;

    private static final String ADMIN_EMAIL = "cand-admin@example.com";
    private static final String ADMIN_PASSWORD = "AdminPassword123!";
    private static final String MARKETER_EMAIL = "cand-marketer@example.com";
    private static final String MARKETER_PASSWORD = "MarketerPass123!";
    private static final String SUPPORTER_EMAIL = "cand-supporter@example.com";
    private static final String SUPPORTER_PASSWORD = "SupporterPass123!";
    private static final String CANDIDATE1_EMAIL = "cand-candidate1@example.com";
    private static final String CANDIDATE1_PASSWORD = "CandidatePass123!";
    private static final String CANDIDATE2_EMAIL = "cand-candidate2@example.com";
    private static final String CANDIDATE2_PASSWORD = "CandidatePass456!";

    private String adminToken;
    private String marketerToken;
    private String supporterToken;
    private String candidate1Token;

    private UUID candidate1Id;
    private UUID candidate2Id;
    private UUID supporterId;

    @BeforeEach
    void setup() throws Exception {
        seedUser(ADMIN_EMAIL, "Cand Admin", ADMIN_PASSWORD, UserRole.ADMIN);
        seedUser(MARKETER_EMAIL, "Cand Marketer", MARKETER_PASSWORD, UserRole.MARKETER);
        User supporter = seedUser(SUPPORTER_EMAIL, "Cand Supporter", SUPPORTER_PASSWORD, UserRole.SUPPORTER);
        User candidate1 = seedUser(CANDIDATE1_EMAIL, "Priya Nair", CANDIDATE1_PASSWORD, UserRole.CANDIDATE);
        User candidate2 = seedUser(CANDIDATE2_EMAIL, "Marcus Chen", CANDIDATE2_PASSWORD, UserRole.CANDIDATE);

        supporterId = supporter.getId();
        candidate1Id = candidate1.getId();
        candidate2Id = candidate2.getId();

        adminToken = login(ADMIN_EMAIL, ADMIN_PASSWORD);
        marketerToken = login(MARKETER_EMAIL, MARKETER_PASSWORD);
        supporterToken = login(SUPPORTER_EMAIL, SUPPORTER_PASSWORD);
        candidate1Token = login(CANDIDATE1_EMAIL, CANDIDATE1_PASSWORD);
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

    private String login(String email, String password) throws Exception {
        String response = mockMvc.perform(post("/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(new LoginRequest(email, password))))
                .andReturn().getResponse().getContentAsString();
        return objectMapper.readTree(response).get("accessToken").asText();
    }

    @Nested
    @DisplayName("GET /candidates")
    class ListCandidates {

        @Test
        @DisplayName("admin lists candidates, paginated")
        void adminCanList() throws Exception {
            mockMvc.perform(get("/candidates")
                            .header("Authorization", "Bearer " + adminToken))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.data").isArray())
                    .andExpect(jsonPath("$.total").value(org.hamcrest.Matchers.greaterThanOrEqualTo(2)));
        }

        @Test
        @DisplayName("marketer can list candidates")
        void marketerCanList() throws Exception {
            mockMvc.perform(get("/candidates")
                            .header("Authorization", "Bearer " + marketerToken))
                    .andExpect(status().isOk());
        }

        @Test
        @DisplayName("supporter can list candidates")
        void supporterCanList() throws Exception {
            mockMvc.perform(get("/candidates")
                            .header("Authorization", "Bearer " + supporterToken))
                    .andExpect(status().isOk());
        }

        @Test
        @DisplayName("candidate cannot list → 403")
        void candidateCannotList() throws Exception {
            mockMvc.perform(get("/candidates")
                            .header("Authorization", "Bearer " + candidate1Token))
                    .andExpect(status().isForbidden());
        }

        @Test
        @DisplayName("unauthenticated → 401")
        void unauthenticatedCannotList() throws Exception {
            mockMvc.perform(get("/candidates"))
                    .andExpect(status().isUnauthorized());
        }

        @Test
        @DisplayName("only returns users with the CANDIDATE role")
        void excludesNonCandidates() throws Exception {
            mockMvc.perform(get("/candidates")
                            .header("Authorization", "Bearer " + adminToken)
                            .param("limit", "100"))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.data[*].id",
                            org.hamcrest.Matchers.not(hasItem(supporterId.toString()))));
        }

        @Test
        @DisplayName("filters by ids for batch name resolution")
        void filtersByIds() throws Exception {
            mockMvc.perform(get("/candidates")
                            .header("Authorization", "Bearer " + adminToken)
                            .param("ids", candidate1Id.toString()))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.data.length()").value(1))
                    .andExpect(jsonPath("$.data[0].id").value(candidate1Id.toString()))
                    .andExpect(jsonPath("$.data[0].name").value("Priya Nair"));
        }
    }

    @Nested
    @DisplayName("GET /candidates/{id}")
    class GetCandidate {

        @Test
        @DisplayName("admin gets candidate by id")
        void adminCanGet() throws Exception {
            mockMvc.perform(get("/candidates/" + candidate1Id)
                            .header("Authorization", "Bearer " + adminToken))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.id").value(candidate1Id.toString()))
                    .andExpect(jsonPath("$.name").value("Priya Nair"));
        }

        @Test
        @DisplayName("supporter gets candidate by id")
        void supporterCanGet() throws Exception {
            mockMvc.perform(get("/candidates/" + candidate2Id)
                            .header("Authorization", "Bearer " + supporterToken))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.name").value("Marcus Chen"));
        }

        @Test
        @DisplayName("candidate cannot get → 403")
        void candidateCannotGet() throws Exception {
            mockMvc.perform(get("/candidates/" + candidate2Id)
                            .header("Authorization", "Bearer " + candidate1Token))
                    .andExpect(status().isForbidden());
        }

        @Test
        @DisplayName("non-candidate id → 404")
        void nonCandidateIdReturns404() throws Exception {
            mockMvc.perform(get("/candidates/" + supporterId)
                            .header("Authorization", "Bearer " + adminToken))
                    .andExpect(status().isNotFound());
        }

        @Test
        @DisplayName("non-existent id → 404")
        void nonExistentIdReturns404() throws Exception {
            mockMvc.perform(get("/candidates/" + UUID.randomUUID())
                            .header("Authorization", "Bearer " + adminToken))
                    .andExpect(status().isNotFound());
        }
    }
}
