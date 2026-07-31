package xyz.catuns.imp.api.scheduleimport;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.context.annotation.Import;
import org.springframework.http.MediaType;
import org.springframework.mock.web.MockMultipartFile;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;
import xyz.catuns.imp.api.TestcontainersConfiguration;
import xyz.catuns.imp.api.auth.dto.LoginRequest;
import xyz.catuns.imp.api.process.entity.InterviewProcess;
import xyz.catuns.imp.api.process.repository.InterviewProcessRepository;
import xyz.catuns.imp.api.user.entity.User;
import xyz.catuns.imp.api.user.entity.UserRole;
import xyz.catuns.imp.api.user.repository.UserRepository;

import java.nio.charset.StandardCharsets;
import java.time.Instant;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.multipart;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
@Import(TestcontainersConfiguration.class)
class ScheduleImportControllerTest {

    private static final String CSV_HEADER = "Candidate Name,Lead Name,Technology,Interview Date,Time,Duration,"
            + "Mode of interview,Client name,Interview Round,Status";

    @Autowired MockMvc mockMvc;
    @Autowired ObjectMapper objectMapper;
    @Autowired UserRepository userRepository;
    @Autowired InterviewProcessRepository processRepository;
    @Autowired PasswordEncoder passwordEncoder;

    private static final String MARKETER_EMAIL    = "import-marketer@example.com";
    private static final String MARKETER_PASSWORD = "MarketerPass123!";

    private String marketerToken;

    @BeforeEach
    void setup() throws Exception {
        seedUser(MARKETER_EMAIL, "Import Marketer", MARKETER_PASSWORD, UserRole.MARKETER);
        seedUser("import-supporter@example.com", "Import Supporter", "SupporterPass123!", UserRole.SUPPORTER);
        marketerToken = login(MARKETER_EMAIL, MARKETER_PASSWORD);
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

    private JsonNode importCsv(String csv) throws Exception {
        MockMultipartFile file = new MockMultipartFile(
                "file", "schedule.csv", "text/csv", csv.getBytes(StandardCharsets.UTF_8));

        String response = mockMvc.perform(multipart("/imports/interview-schedule")
                        .file(file)
                        .header("Authorization", "Bearer " + marketerToken))
                .andExpect(status().isOk())
                .andReturn().getResponse().getContentAsString();
        return objectMapper.readTree(response);
    }

    @Test
    @DisplayName("importing a new process sets startedAt to the session's scheduled date, not the import time")
    void newProcessStartedAtMatchesFirstSessionDate() throws Exception {
        Instant beforeImport = Instant.now();
        String csv = CSV_HEADER + "\n"
                + "Import Candidate One,Import Lead One,Java,01-Dec-26,10:00 AM EST,1 Hour,Video,"
                + "Import Test Corp,Round 1,Scheduled\n";

        JsonNode result = importCsv(csv).get("results").get(0);
        assertThat(result.get("outcome").asText()).isEqualTo("IMPORTED");

        UUID processId = UUID.fromString(result.get("processId").asText());
        InterviewProcess process = processRepository.findById(processId).orElseThrow();

        Instant expectedScheduledAt = ScheduleDateTimeParser.parse("01-Dec-26", "10:00 AM EST");
        assertThat(process.getStartedAt()).isEqualTo(expectedScheduledAt);
        // Sanity check the fix: a future-dated import must not fall back to "now".
        assertThat(process.getStartedAt()).isNotEqualTo(beforeImport);
        assertThat(process.getStartedAt()).isAfter(beforeImport);
    }

    @Test
    @DisplayName("startedAt tracks the earliest session across rounds, ignoring later ones")
    void startedAtTracksEarliestSessionAcrossRounds() throws Exception {
        String round2Csv = CSV_HEADER + "\n"
                + "Import Candidate Two,Import Lead Two,Java,15-Dec-26,10:00 AM EST,1 Hour,Video,"
                + "Import Test Corp,Round 2,Scheduled\n";
        JsonNode round2Result = importCsv(round2Csv).get("results").get(0);
        UUID processId = UUID.fromString(round2Result.get("processId").asText());

        Instant round2ScheduledAt = ScheduleDateTimeParser.parse("15-Dec-26", "10:00 AM EST");
        assertThat(processRepository.findById(processId).orElseThrow().getStartedAt())
                .isEqualTo(round2ScheduledAt);

        // An earlier round arrives later in a separate import - startedAt must move backward.
        String round1Csv = CSV_HEADER + "\n"
                + "Import Candidate Two,Import Lead Two,Java,01-Dec-26,09:00 AM EST,1 Hour,Video,"
                + "Import Test Corp,Round 1,Scheduled\n";
        importCsv(round1Csv);

        Instant round1ScheduledAt = ScheduleDateTimeParser.parse("01-Dec-26", "09:00 AM EST");
        assertThat(processRepository.findById(processId).orElseThrow().getStartedAt())
                .isEqualTo(round1ScheduledAt);

        // A later round arriving afterward must NOT push startedAt forward again.
        String round3Csv = CSV_HEADER + "\n"
                + "Import Candidate Two,Import Lead Two,Java,20-Dec-26,09:00 AM EST,1 Hour,Video,"
                + "Import Test Corp,Round 3,Scheduled\n";
        importCsv(round3Csv);

        assertThat(processRepository.findById(processId).orElseThrow().getStartedAt())
                .isEqualTo(round1ScheduledAt);
    }

    @Test
    @DisplayName("rescheduling the only session to an earlier date corrects startedAt")
    void reschedulingEarlierUpdatesStartedAt() throws Exception {
        String csv = CSV_HEADER + "\n"
                + "Import Candidate Three,Import Lead Three,Java,10-Dec-26,10:00 AM EST,1 Hour,Video,"
                + "Import Test Corp,Round 1,Scheduled\n";
        JsonNode result = importCsv(csv).get("results").get(0);
        UUID processId = UUID.fromString(result.get("processId").asText());

        // Re-importing the same round with an earlier date updates the existing session.
        String rescheduledCsv = CSV_HEADER + "\n"
                + "Import Candidate Three,Import Lead Three,Java,05-Dec-26,10:00 AM EST,1 Hour,Video,"
                + "Import Test Corp,Round 1,Scheduled\n";
        JsonNode rescheduledResult = importCsv(rescheduledCsv).get("results").get(0);
        assertThat(rescheduledResult.get("outcome").asText()).isEqualTo("UPDATED");

        Instant expectedScheduledAt = ScheduleDateTimeParser.parse("05-Dec-26", "10:00 AM EST");
        assertThat(processRepository.findById(processId).orElseThrow().getStartedAt())
                .isEqualTo(expectedScheduledAt);
    }
}