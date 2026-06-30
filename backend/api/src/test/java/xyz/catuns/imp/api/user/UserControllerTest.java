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
import xyz.catuns.imp.api.user.dto.CreateUserRequest;
import xyz.catuns.imp.api.user.dto.UpdateUserRequest;
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
class UserControllerTest {

    @Autowired MockMvc mockMvc;
    @Autowired ObjectMapper objectMapper;
    @Autowired UserRepository userRepository;
    @Autowired PasswordEncoder passwordEncoder;

    private static final String ADMIN_EMAIL = "admin@example.com";
    private static final String ADMIN_PASSWORD = "AdminPassword123!";
    private static final String SUPPORTER_EMAIL = "supporter@example.com";
    private static final String SUPPORTER_PASSWORD = "SupporterPass123!";

    private String adminToken;
    private String supporterToken;
    private UUID supporterUserId;

    @BeforeEach
    void setup() throws Exception {
        seedUser(ADMIN_EMAIL, "Admin User", ADMIN_PASSWORD, UserRole.ADMIN);
        User supporter = seedUser(SUPPORTER_EMAIL, "Supporter User", SUPPORTER_PASSWORD, UserRole.SUPPORTER);
        supporterUserId = supporter.getId();

        adminToken = login(ADMIN_EMAIL, ADMIN_PASSWORD);
        supporterToken = login(SUPPORTER_EMAIL, SUPPORTER_PASSWORD);
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
    @DisplayName("GET /users")
    class ListUsers {

        @Test
        @DisplayName("returns 200 with paginated users for admin")
        void adminCanListUsers() throws Exception {
            mockMvc.perform(get("/users")
                            .header("Authorization", "Bearer " + adminToken))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.data").isArray())
                    .andExpect(jsonPath("$.total").isNumber())
                    .andExpect(jsonPath("$.page").isNumber())
                    .andExpect(jsonPath("$.limit").isNumber());
        }

        @Test
        @DisplayName("returns 403 when non-admin calls list")
        void nonAdminCannotListUsers() throws Exception {
            mockMvc.perform(get("/users")
                            .header("Authorization", "Bearer " + supporterToken))
                    .andExpect(status().isForbidden());
        }

        @Test
        @DisplayName("returns 401 when unauthenticated")
        void unauthenticatedCannotListUsers() throws Exception {
            mockMvc.perform(get("/users"))
                    .andExpect(status().isUnauthorized());
        }

        @Test
        @DisplayName("filters users by role")
        void adminCanFilterByRole() throws Exception {
            mockMvc.perform(get("/users")
                            .header("Authorization", "Bearer " + adminToken)
                            .param("role", "SUPPORTER"))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.data[*].role").value(org.hamcrest.Matchers.everyItem(
                            org.hamcrest.Matchers.is("SUPPORTER"))));
        }
    }

    @Nested
    @DisplayName("POST /users")
    class CreateUser {

        @Test
        @DisplayName("returns 201 with created user for admin")
        void adminCanCreateUser() throws Exception {
            CreateUserRequest request = new CreateUserRequest(
                    "New Candidate", "new-candidate@example.com", "NewPassword123!", UserRole.CANDIDATE);

            mockMvc.perform(post("/users")
                            .header("Authorization", "Bearer " + adminToken)
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(objectMapper.writeValueAsString(request)))
                    .andExpect(status().isCreated())
                    .andExpect(jsonPath("$.email").value("new-candidate@example.com"))
                    .andExpect(jsonPath("$.role").value("CANDIDATE"));
        }

        @Test
        @DisplayName("returns 403 when non-admin tries to create user")
        void nonAdminCannotCreateUser() throws Exception {
            CreateUserRequest request = new CreateUserRequest(
                    "Another User", "another@example.com", "Password123456!", UserRole.CANDIDATE);

            mockMvc.perform(post("/users")
                            .header("Authorization", "Bearer " + supporterToken)
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(objectMapper.writeValueAsString(request)))
                    .andExpect(status().isForbidden());
        }

        @Test
        @DisplayName("returns 409 when email already in use")
        void duplicateEmailReturnsConflict() throws Exception {
            CreateUserRequest request = new CreateUserRequest(
                    "Duplicate", SUPPORTER_EMAIL, "Password123456!", UserRole.CANDIDATE);

            mockMvc.perform(post("/users")
                            .header("Authorization", "Bearer " + adminToken)
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(objectMapper.writeValueAsString(request)))
                    .andExpect(status().isConflict());
        }

        @Test
        @DisplayName("returns 400 when password is too short")
        void shortPasswordReturnsValidationError() throws Exception {
            CreateUserRequest request = new CreateUserRequest(
                    "Short Pass", "shortpass@example.com", "short", UserRole.CANDIDATE);

            mockMvc.perform(post("/users")
                            .header("Authorization", "Bearer " + adminToken)
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(objectMapper.writeValueAsString(request)))
                    .andExpect(status().isBadRequest());
        }

        @Test
        @DisplayName("returns 400 when email is invalid")
        void invalidEmailReturnsValidationError() throws Exception {
            CreateUserRequest request = new CreateUserRequest(
                    "Bad Email", "not-an-email", "Password123456!", UserRole.CANDIDATE);

            mockMvc.perform(post("/users")
                            .header("Authorization", "Bearer " + adminToken)
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(objectMapper.writeValueAsString(request)))
                    .andExpect(status().isBadRequest());
        }
    }

    @Nested
    @DisplayName("GET /users/{id}")
    class GetUser {

        @Test
        @DisplayName("returns 200 for admin fetching any user")
        void adminCanFetchAnyUser() throws Exception {
            mockMvc.perform(get("/users/" + supporterUserId)
                            .header("Authorization", "Bearer " + adminToken))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.id").value(supporterUserId.toString()));
        }

        @Test
        @DisplayName("returns 200 when user fetches their own profile")
        void userCanFetchOwnProfile() throws Exception {
            mockMvc.perform(get("/users/" + supporterUserId)
                            .header("Authorization", "Bearer " + supporterToken))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.email").value(SUPPORTER_EMAIL));
        }

        @Test
        @DisplayName("returns 403 when non-admin fetches another user's profile")
        void nonAdminCannotFetchOtherProfile() throws Exception {
            UUID adminId = userRepository.findByEmail(ADMIN_EMAIL).orElseThrow().getId();
            mockMvc.perform(get("/users/" + adminId)
                            .header("Authorization", "Bearer " + supporterToken))
                    .andExpect(status().isForbidden());
        }

        @Test
        @DisplayName("returns 404 for non-existent user")
        void notFoundForMissingUser() throws Exception {
            mockMvc.perform(get("/users/" + UUID.randomUUID())
                            .header("Authorization", "Bearer " + adminToken))
                    .andExpect(status().isNotFound());
        }
    }

    @Nested
    @DisplayName("PATCH /users/{id}")
    class UpdateUser {

        @Test
        @DisplayName("returns 200 with updated user for admin")
        void adminCanUpdateUser() throws Exception {
            UpdateUserRequest request = new UpdateUserRequest("Updated Name", null, null, null);

            mockMvc.perform(patch("/users/" + supporterUserId)
                            .header("Authorization", "Bearer " + adminToken)
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(objectMapper.writeValueAsString(request)))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.name").value("Updated Name"));
        }

        @Test
        @DisplayName("returns 403 when non-admin tries to update user")
        void nonAdminCannotUpdateUser() throws Exception {
            UpdateUserRequest request = new UpdateUserRequest("Hacked Name", null, null, null);

            mockMvc.perform(patch("/users/" + supporterUserId)
                            .header("Authorization", "Bearer " + supporterToken)
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(objectMapper.writeValueAsString(request)))
                    .andExpect(status().isForbidden());
        }

        @Test
        @DisplayName("returns 404 when updating non-existent user")
        void notFoundWhenUpdatingMissingUser() throws Exception {
            UpdateUserRequest request = new UpdateUserRequest("Name", null, null, null);

            mockMvc.perform(patch("/users/" + UUID.randomUUID())
                            .header("Authorization", "Bearer " + adminToken)
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(objectMapper.writeValueAsString(request)))
                    .andExpect(status().isNotFound());
        }
    }
}
