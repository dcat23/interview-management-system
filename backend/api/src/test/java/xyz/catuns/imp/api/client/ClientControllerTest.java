package xyz.catuns.imp.api.client;

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
import xyz.catuns.imp.api.client.dto.CreateClientRequest;
import xyz.catuns.imp.api.client.dto.UpdateClientRequest;
import xyz.catuns.imp.api.client.entity.Client;
import xyz.catuns.imp.api.client.repository.ClientRepository;
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
class ClientControllerTest {

    @Autowired MockMvc mockMvc;
    @Autowired ObjectMapper objectMapper;
    @Autowired UserRepository userRepository;
    @Autowired ClientRepository clientRepository;
    @Autowired PasswordEncoder passwordEncoder;

    private static final String ADMIN_EMAIL = "client-admin@example.com";
    private static final String ADMIN_PASSWORD = "AdminPassword123!";
    private static final String MARKETER_EMAIL = "client-marketer@example.com";
    private static final String MARKETER_PASSWORD = "MarketerPass123!";
    private static final String SUPPORTER_EMAIL = "client-supporter@example.com";
    private static final String SUPPORTER_PASSWORD = "SupporterPass123!";
    private static final String CANDIDATE_EMAIL = "client-candidate@example.com";
    private static final String CANDIDATE_PASSWORD = "CandidatePass123!";

    private String adminToken;
    private String marketerToken;
    private String supporterToken;
    private String candidateToken;
    private UUID existingClientId;

    @BeforeEach
    void setup() throws Exception {
        seedUser(ADMIN_EMAIL, "Client Admin", ADMIN_PASSWORD, UserRole.ADMIN);
        seedUser(MARKETER_EMAIL, "Client Marketer", MARKETER_PASSWORD, UserRole.MARKETER);
        seedUser(SUPPORTER_EMAIL, "Client Supporter", SUPPORTER_PASSWORD, UserRole.SUPPORTER);
        seedUser(CANDIDATE_EMAIL, "Client Candidate", CANDIDATE_PASSWORD, UserRole.CANDIDATE);

        adminToken = login(ADMIN_EMAIL, ADMIN_PASSWORD);
        marketerToken = login(MARKETER_EMAIL, MARKETER_PASSWORD);
        supporterToken = login(SUPPORTER_EMAIL, SUPPORTER_PASSWORD);
        candidateToken = login(CANDIDATE_EMAIL, CANDIDATE_PASSWORD);

        existingClientId = seedClient("Existing Corp", "Technology").getId();
    }

    private void seedUser(String email, String name, String password, UserRole role) {
        userRepository.findByEmail(email).orElseGet(() -> {
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

    private String login(String email, String password) throws Exception {
        String response = mockMvc.perform(post("/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(new LoginRequest(email, password))))
                .andReturn().getResponse().getContentAsString();
        return objectMapper.readTree(response).get("accessToken").asText();
    }

    @Nested
    @DisplayName("GET /clients")
    class ListClients {

        @Test
        @DisplayName("returns 200 for admin")
        void adminCanListClients() throws Exception {
            mockMvc.perform(get("/clients")
                            .header("Authorization", "Bearer " + adminToken))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.data").isArray())
                    .andExpect(jsonPath("$.total").isNumber());
        }

        @Test
        @DisplayName("returns 200 for marketer")
        void marketerCanListClients() throws Exception {
            mockMvc.perform(get("/clients")
                            .header("Authorization", "Bearer " + marketerToken))
                    .andExpect(status().isOk());
        }

        @Test
        @DisplayName("returns 200 for supporter")
        void supporterCanListClients() throws Exception {
            mockMvc.perform(get("/clients")
                            .header("Authorization", "Bearer " + supporterToken))
                    .andExpect(status().isOk());
        }

        @Test
        @DisplayName("returns 403 for candidate")
        void candidateCannotListClients() throws Exception {
            mockMvc.perform(get("/clients")
                            .header("Authorization", "Bearer " + candidateToken))
                    .andExpect(status().isForbidden());
        }

        @Test
        @DisplayName("returns 401 when unauthenticated")
        void unauthenticatedCannotListClients() throws Exception {
            mockMvc.perform(get("/clients"))
                    .andExpect(status().isUnauthorized());
        }
    }

    @Nested
    @DisplayName("POST /clients")
    class CreateClient {

        @Test
        @DisplayName("returns 201 for admin")
        void adminCanCreateClient() throws Exception {
            CreateClientRequest request = new CreateClientRequest("Acme Corp", "Finance");

            mockMvc.perform(post("/clients")
                            .header("Authorization", "Bearer " + adminToken)
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(objectMapper.writeValueAsString(request)))
                    .andExpect(status().isCreated())
                    .andExpect(jsonPath("$.name").value("Acme Corp"))
                    .andExpect(jsonPath("$.industry").value("Finance"));
        }

        @Test
        @DisplayName("returns 201 for marketer")
        void marketerCanCreateClient() throws Exception {
            CreateClientRequest request = new CreateClientRequest("Beta Ltd", "Healthcare");

            mockMvc.perform(post("/clients")
                            .header("Authorization", "Bearer " + marketerToken)
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(objectMapper.writeValueAsString(request)))
                    .andExpect(status().isCreated());
        }

        @Test
        @DisplayName("returns 403 for supporter")
        void supporterCannotCreateClient() throws Exception {
            CreateClientRequest request = new CreateClientRequest("Gamma Inc", "Retail");

            mockMvc.perform(post("/clients")
                            .header("Authorization", "Bearer " + supporterToken)
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(objectMapper.writeValueAsString(request)))
                    .andExpect(status().isForbidden());
        }

        @Test
        @DisplayName("returns 403 for candidate")
        void candidateCannotCreateClient() throws Exception {
            CreateClientRequest request = new CreateClientRequest("Delta LLC", "Energy");

            mockMvc.perform(post("/clients")
                            .header("Authorization", "Bearer " + candidateToken)
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(objectMapper.writeValueAsString(request)))
                    .andExpect(status().isForbidden());
        }

        @Test
        @DisplayName("returns 400 when name is missing")
        void missingNameReturnsValidationError() throws Exception {
            mockMvc.perform(post("/clients")
                            .header("Authorization", "Bearer " + adminToken)
                            .contentType(MediaType.APPLICATION_JSON)
                            .content("{\"industry\":\"Tech\"}"))
                    .andExpect(status().isBadRequest());
        }
    }

    @Nested
    @DisplayName("PATCH /clients/{id}")
    class UpdateClient {

        @Test
        @DisplayName("returns 200 for admin")
        void adminCanUpdateClient() throws Exception {
            UpdateClientRequest request = new UpdateClientRequest("Renamed Corp", null, null);

            mockMvc.perform(patch("/clients/" + existingClientId)
                            .header("Authorization", "Bearer " + adminToken)
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(objectMapper.writeValueAsString(request)))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.name").value("Renamed Corp"));
        }

        @Test
        @DisplayName("returns 200 for marketer")
        void marketerCanUpdateClient() throws Exception {
            UpdateClientRequest request = new UpdateClientRequest(null, "Updated Industry", null);

            mockMvc.perform(patch("/clients/" + existingClientId)
                            .header("Authorization", "Bearer " + marketerToken)
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(objectMapper.writeValueAsString(request)))
                    .andExpect(status().isOk());
        }

        @Test
        @DisplayName("returns 403 for supporter")
        void supporterCannotUpdateClient() throws Exception {
            UpdateClientRequest request = new UpdateClientRequest("Hacked Name", null, null);

            mockMvc.perform(patch("/clients/" + existingClientId)
                            .header("Authorization", "Bearer " + supporterToken)
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(objectMapper.writeValueAsString(request)))
                    .andExpect(status().isForbidden());
        }

        @Test
        @DisplayName("returns 404 for non-existent client")
        void notFoundForMissingClient() throws Exception {
            UpdateClientRequest request = new UpdateClientRequest("Name", null, null);

            mockMvc.perform(patch("/clients/" + UUID.randomUUID())
                            .header("Authorization", "Bearer " + adminToken)
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(objectMapper.writeValueAsString(request)))
                    .andExpect(status().isNotFound());
        }
    }
}
