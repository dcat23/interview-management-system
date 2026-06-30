package xyz.catuns.imp.api.auth;

import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.context.annotation.Import;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.http.MediaType;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;
import xyz.catuns.imp.api.TestcontainersConfiguration;
import xyz.catuns.imp.api.auth.dto.LoginRequest;
import xyz.catuns.imp.api.auth.dto.RefreshRequest;
import xyz.catuns.imp.api.user.entity.User;
import xyz.catuns.imp.api.user.entity.UserRole;
import xyz.catuns.imp.api.user.repository.UserRepository;

import java.util.Set;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
@Import(TestcontainersConfiguration.class)
class AuthControllerTest {

    @Autowired MockMvc mockMvc;
    @Autowired ObjectMapper objectMapper;
    @Autowired UserRepository userRepository;
    @Autowired PasswordEncoder passwordEncoder;
    @Autowired StringRedisTemplate redisTemplate;

    private static final String EMAIL = "auth-test@example.com";
    private static final String PASSWORD = "TestPassword123!";

    @BeforeEach
    void setup() {
        if (!userRepository.existsByEmail(EMAIL)) {
            User user = new User();
            user.setName("Auth Tester");
            user.setEmail(EMAIL);
            user.setPassword(passwordEncoder.encode(PASSWORD));
            user.setRole(UserRole.SUPPORTER);
            userRepository.save(user);
        }
    }

    @Nested
    @DisplayName("POST /auth/login")
    class Login {

        @Test
        @DisplayName("returns 200 with access and refresh tokens on valid credentials")
        void loginWithValidCredentials() throws Exception {
            mockMvc.perform(post("/auth/login")
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(objectMapper.writeValueAsString(new LoginRequest(EMAIL, PASSWORD))))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.accessToken").isNotEmpty())
                    .andExpect(jsonPath("$.refreshToken").isNotEmpty())
                    .andExpect(jsonPath("$.role").value("supporter"))
                    .andExpect(jsonPath("$.expiresIn").isNumber());
        }

        @Test
        @DisplayName("returns 401 on wrong password")
        void loginWithWrongPassword() throws Exception {
            mockMvc.perform(post("/auth/login")
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(objectMapper.writeValueAsString(new LoginRequest(EMAIL, "wrongpassword"))))
                    .andExpect(status().isUnauthorized());
        }

        @Test
        @DisplayName("returns 401 on unknown email")
        void loginWithUnknownEmail() throws Exception {
            mockMvc.perform(post("/auth/login")
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(objectMapper.writeValueAsString(new LoginRequest("nobody@example.com", PASSWORD))))
                    .andExpect(status().isUnauthorized());
        }

        @Test
        @DisplayName("returns 400 when email is missing")
        void loginWithMissingEmail() throws Exception {
            mockMvc.perform(post("/auth/login")
                            .contentType(MediaType.APPLICATION_JSON)
                            .content("{\"password\":\"" + PASSWORD + "\"}"))
                    .andExpect(status().isBadRequest());
        }

        @Test
        @DisplayName("returns 400 when password is missing")
        void loginWithMissingPassword() throws Exception {
            mockMvc.perform(post("/auth/login")
                            .contentType(MediaType.APPLICATION_JSON)
                            .content("{\"email\":\"" + EMAIL + "\"}"))
                    .andExpect(status().isBadRequest());
        }
    }

    @Nested
    @DisplayName("POST /auth/refresh")
    class Refresh {

        private String refreshToken;

        @BeforeEach
        void obtainRefreshToken() throws Exception {
            String response = mockMvc.perform(post("/auth/login")
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(objectMapper.writeValueAsString(new LoginRequest(EMAIL, PASSWORD))))
                    .andReturn().getResponse().getContentAsString();
            refreshToken = objectMapper.readTree(response).get("refreshToken").asText();
        }

        @Test
        @DisplayName("returns 200 with new access token on valid refresh token")
        void refreshWithValidToken() throws Exception {
            mockMvc.perform(post("/auth/refresh")
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(objectMapper.writeValueAsString(new RefreshRequest(refreshToken))))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.accessToken").isNotEmpty())
                    .andExpect(jsonPath("$.expiresIn").isNumber());
        }

        @Test
        @DisplayName("returns 401 on invalid refresh token")
        void refreshWithInvalidToken() throws Exception {
            mockMvc.perform(post("/auth/refresh")
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(objectMapper.writeValueAsString(new RefreshRequest("not-a-real-token"))))
                    .andExpect(status().isUnauthorized());
        }

        @Test
        @DisplayName("returns 401 on reused refresh token after rotation")
        void refreshTokenRotation() throws Exception {
            mockMvc.perform(post("/auth/refresh")
                    .contentType(MediaType.APPLICATION_JSON)
                    .content(objectMapper.writeValueAsString(new RefreshRequest(refreshToken))))
                    .andExpect(status().isOk());

            mockMvc.perform(post("/auth/refresh")
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(objectMapper.writeValueAsString(new RefreshRequest(refreshToken))))
                    .andExpect(status().isUnauthorized());
        }
    }

    @Nested
    @DisplayName("POST /auth/logout")
    class Logout {

        private String accessToken;
        private String refreshToken;

        @BeforeEach
        void obtainTokens() throws Exception {
            // Two logins for the same user within the same clock-second produce identical JWTs
            // (same sub+iat → same HMAC). Clear the blocklist first so a token blocked by a
            // prior test case doesn't cause the next @BeforeEach login to return a dead token.
            Set<String> blocked = redisTemplate.keys("ims:blocklist:*");
            if (blocked != null && !blocked.isEmpty()) {
                redisTemplate.delete(blocked);
            }
            String response = mockMvc.perform(post("/auth/login")
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(objectMapper.writeValueAsString(new LoginRequest(EMAIL, PASSWORD))))
                    .andReturn().getResponse().getContentAsString();
            accessToken = objectMapper.readTree(response).get("accessToken").asText();
            refreshToken = objectMapper.readTree(response).get("refreshToken").asText();
        }

        @Test
        @DisplayName("returns 204 on successful logout")
        void logoutReturnsNoContent() throws Exception {
            mockMvc.perform(post("/auth/logout")
                            .header("Authorization", "Bearer " + accessToken)
                            .param("refreshToken", refreshToken))
                    .andExpect(status().isNoContent());
        }

        @Test
        @DisplayName("blocklisted access token returns 401 on subsequent requests")
        void loggedOutAccessTokenIsRejected() throws Exception {
            mockMvc.perform(post("/auth/logout")
                    .header("Authorization", "Bearer " + accessToken)
                    .param("refreshToken", refreshToken))
                    .andExpect(status().isNoContent());

            mockMvc.perform(post("/auth/logout")
                            .header("Authorization", "Bearer " + accessToken))
                    .andExpect(status().isUnauthorized());
        }

        @Test
        @DisplayName("refresh token is invalidated after logout")
        void loggedOutRefreshTokenIsRejected() throws Exception {
            mockMvc.perform(post("/auth/logout")
                    .header("Authorization", "Bearer " + accessToken)
                    .param("refreshToken", refreshToken))
                    .andExpect(status().isNoContent());

            mockMvc.perform(post("/auth/refresh")
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(objectMapper.writeValueAsString(new RefreshRequest(refreshToken))))
                    .andExpect(status().isUnauthorized());
        }

        @Test
        @DisplayName("returns 401 when Authorization header is missing")
        void logoutWithoutToken() throws Exception {
            mockMvc.perform(post("/auth/logout"))
                    .andExpect(status().isUnauthorized());
        }
    }
}
