package xyz.catuns.imp.api.session;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.apache.kafka.clients.consumer.Consumer;
import org.apache.kafka.clients.consumer.ConsumerConfig;
import org.apache.kafka.clients.consumer.ConsumerRecords;
import org.apache.kafka.common.serialization.StringDeserializer;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.context.annotation.Import;
import org.springframework.http.MediaType;
import org.springframework.kafka.core.DefaultKafkaConsumerFactory;
import org.springframework.kafka.test.utils.KafkaTestUtils;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;
import xyz.catuns.imp.api.TestcontainersConfiguration;
import xyz.catuns.imp.api.auth.dto.LoginRequest;
import xyz.catuns.imp.api.client.entity.Client;
import xyz.catuns.imp.api.client.repository.ClientRepository;
import xyz.catuns.imp.api.process.entity.InterviewProcess;
import xyz.catuns.imp.api.process.repository.InterviewProcessRepository;
import xyz.catuns.imp.api.session.dto.TransitionRequest;
import xyz.catuns.imp.api.session.entity.InterviewSession;
import xyz.catuns.imp.api.session.entity.SessionStatus;
import xyz.catuns.imp.api.session.repository.InterviewSessionRepository;
import xyz.catuns.imp.api.user.entity.User;
import xyz.catuns.imp.api.user.entity.UserRole;
import xyz.catuns.imp.api.user.repository.UserRepository;

import java.time.Duration;
import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.List;
import java.util.Map;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.patch;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
@Import(TestcontainersConfiguration.class)
class SessionStatusEventPublisherTest {

    @Autowired MockMvc mockMvc;
    @Autowired ObjectMapper objectMapper;
    @Autowired UserRepository userRepository;
    @Autowired ClientRepository clientRepository;
    @Autowired InterviewProcessRepository processRepository;
    @Autowired InterviewSessionRepository sessionRepository;
    @Autowired PasswordEncoder passwordEncoder;

    @Value("${spring.kafka.bootstrap-servers}")
    private String bootstrapServers;

    @Value("${app.kafka.topics.session-status-changed}")
    private String topic;

    private static final String MARKETER_EMAIL     = "event-marketer@example.com";
    private static final String MARKETER_PASSWORD  = "MarketerPass123!";
    private static final String SUPPORTER_EMAIL    = "event-supporter@example.com";
    private static final String SUPPORTER_PASSWORD = "SupporterPass123!";

    private String supporterToken;
    private String marketerToken;
    private UUID supporterId;
    private UUID processId;

    @BeforeEach
    void setup() throws Exception {
        UUID marketerId = seedUser(MARKETER_EMAIL,  "Event Marketer",  MARKETER_PASSWORD,  UserRole.MARKETER).getId();
        supporterId     = seedUser(SUPPORTER_EMAIL, "Event Supporter", SUPPORTER_PASSWORD, UserRole.SUPPORTER).getId();
        UUID candidateId = seedUser("event-candidate@example.com", "Event Candidate", "CandidatePass123!", UserRole.CANDIDATE).getId();

        marketerToken  = login(MARKETER_EMAIL,  MARKETER_PASSWORD);
        supporterToken = login(SUPPORTER_EMAIL, SUPPORTER_PASSWORD);

        UUID clientId = seedClient("Event Test Corp", "Technology").getId();
        processId = seedProcess(candidateId, clientId, marketerId, "Java").getId();
    }

    @Test
    @DisplayName("successful transition publishes event to session.status.changed with correct payload")
    void transitionPublishesKafkaEvent() throws Exception {
        InterviewSession session = freshSession();

        Consumer<String, String> consumer = createConsumer("event-test-group-" + UUID.randomUUID());
        consumer.subscribe(List.of(topic));

        mockMvc.perform(patch("/sessions/" + session.getId() + "/status")
                        .header("Authorization", "Bearer " + supporterToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(new TransitionRequest(SessionStatus.IN_REVIEW))))
                .andExpect(status().isOk());

        ConsumerRecords<String, String> records = KafkaTestUtils.getRecords(consumer, Duration.ofSeconds(10));
        consumer.close();

        assertThat(records).isNotEmpty();

        String payload = records.iterator().next().value();
        JsonNode event = objectMapper.readTree(payload);

        assertThat(event.get("sessionId").asText()).isEqualTo(session.getId().toString());
        assertThat(event.get("processId").asText()).isEqualTo(processId.toString());
        assertThat(event.get("fromStatus").asText()).isEqualTo("SCHEDULED");
        assertThat(event.get("toStatus").asText()).isEqualTo("IN_REVIEW");
        assertThat(event.get("changeSource").asText()).isEqualTo("MANUAL");
        assertThat(event.get("changedAt").asText()).isNotBlank();
    }

    @Test
    @DisplayName("failed transition (409) does not publish any event")
    void invalidTransitionDoesNotPublishEvent() throws Exception {
        InterviewSession session = freshSession();

        Consumer<String, String> consumer = createConsumer("event-test-group-invalid-" + UUID.randomUUID());
        consumer.subscribe(List.of(topic));
        // drain any pre-existing messages
        KafkaTestUtils.getRecords(consumer, Duration.ofSeconds(2));

        mockMvc.perform(patch("/sessions/" + session.getId() + "/status")
                        .header("Authorization", "Bearer " + supporterToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(new TransitionRequest(SessionStatus.PASSED))))
                .andExpect(status().isConflict());

        ConsumerRecords<String, String> records = KafkaTestUtils.getRecords(consumer, Duration.ofSeconds(3));
        consumer.close();

        assertThat(records).isEmpty();
    }

    @Test
    @DisplayName("background job transition publishes event with BACKGROUND_JOB change_source")
    void backgroundJobTransitionPublishesEvent(@Autowired SessionStatusTransitionService transitionService) throws Exception {
        InterviewSession session = freshSession();
        UUID systemActorId = UUID.randomUUID();

        Consumer<String, String> consumer = createConsumer("event-test-group-job-" + UUID.randomUUID());
        consumer.subscribe(List.of(topic));

        transitionService.transitionByJob(session.getId(), SessionStatus.IN_REVIEW, systemActorId);

        ConsumerRecords<String, String> records = KafkaTestUtils.getRecords(consumer, Duration.ofSeconds(10));
        consumer.close();

        assertThat(records).isNotEmpty();
        JsonNode event = objectMapper.readTree(records.iterator().next().value());
        assertThat(event.get("changeSource").asText()).isEqualTo("BACKGROUND_JOB");
        assertThat(event.get("fromStatus").asText()).isEqualTo("SCHEDULED");
        assertThat(event.get("toStatus").asText()).isEqualTo("IN_REVIEW");
    }

    private InterviewSession freshSession() {
        InterviewSession session = new InterviewSession();
        session.setProcessId(processId);
        session.setSupporterId(supporterId);
        session.setRound("Round 1");
        session.setMode("Video");
        session.setDurationMinutes(60);
        session.setScheduledAt(Instant.now().plus(7, ChronoUnit.DAYS));
        return sessionRepository.save(session);
    }

    private Consumer<String, String> createConsumer(String groupId) {
        Map<String, Object> props = KafkaTestUtils.consumerProps(bootstrapServers, groupId, "true");
        props.put(ConsumerConfig.AUTO_OFFSET_RESET_CONFIG, "earliest");
        return new DefaultKafkaConsumerFactory<>(props, new StringDeserializer(), new StringDeserializer())
                .createConsumer();
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
}
