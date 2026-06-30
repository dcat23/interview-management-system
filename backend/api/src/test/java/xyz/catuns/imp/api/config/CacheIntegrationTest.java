package xyz.catuns.imp.api.config;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.cache.CacheManager;
import org.springframework.context.annotation.Import;
import org.springframework.security.test.context.support.WithMockUser;
import org.springframework.test.context.ActiveProfiles;
import xyz.catuns.imp.api.TestcontainersConfiguration;
import xyz.catuns.imp.api.client.entity.Client;
import xyz.catuns.imp.api.client.repository.ClientRepository;
import xyz.catuns.imp.api.process.entity.InterviewProcess;
import xyz.catuns.imp.api.process.repository.InterviewProcessRepository;
import xyz.catuns.imp.api.question.SessionQuestionService;
import xyz.catuns.imp.api.question.dto.LinkQuestionRequest;
import xyz.catuns.imp.api.question.dto.SessionQuestionResponse;
import xyz.catuns.imp.api.question.entity.Question;
import xyz.catuns.imp.api.question.entity.SessionQuestion;
import xyz.catuns.imp.api.question.repository.QuestionRepository;
import xyz.catuns.imp.api.question.repository.SessionQuestionRepository;
import xyz.catuns.imp.api.session.entity.InterviewSession;
import xyz.catuns.imp.api.session.repository.InterviewSessionRepository;
import xyz.catuns.imp.api.user.entity.User;
import xyz.catuns.imp.api.user.entity.UserRole;
import xyz.catuns.imp.api.user.repository.UserRepository;

import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.List;
import java.util.Objects;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;

@SpringBootTest
@ActiveProfiles("test")
@Import(TestcontainersConfiguration.class)
class CacheIntegrationTest {

    @Autowired CacheManager cacheManager;
    @Autowired SessionQuestionService sessionQuestionService;
    @Autowired SessionQuestionRepository sessionQuestionRepository;
    @Autowired QuestionRepository questionRepository;
    @Autowired InterviewSessionRepository sessionRepository;
    @Autowired InterviewProcessRepository processRepository;
    @Autowired ClientRepository clientRepository;
    @Autowired UserRepository userRepository;

    private UUID sessionId;
    private UUID question1Id;
    private UUID question2Id;
    private UUID adminId;

    @BeforeEach
    void setup() {
        Objects.requireNonNull(cacheManager.getCache(CacheConfig.QUESTIONS_BY_SESSION)).clear();

        User admin = userRepository.findByEmail("cache-admin@example.com").orElseGet(() -> {
            User u = new User();
            u.setName("Cache Admin");
            u.setEmail("cache-admin@example.com");
            u.setPassword("$2a$10$irrelevant");
            u.setRole(UserRole.ADMIN);
            return userRepository.save(u);
        });
        adminId = admin.getId();

        User supporter = userRepository.findByEmail("cache-supporter@example.com").orElseGet(() -> {
            User u = new User();
            u.setName("Cache Supporter");
            u.setEmail("cache-supporter@example.com");
            u.setPassword("$2a$10$irrelevant");
            u.setRole(UserRole.SUPPORTER);
            return userRepository.save(u);
        });

        Client client = clientRepository.findAll().stream()
                .filter(c -> c.getName().equals("Cache Corp"))
                .findFirst()
                .orElseGet(() -> {
                    Client c = new Client();
                    c.setName("Cache Corp");
                    c.setIndustry("Tech");
                    return clientRepository.save(c);
                });

        User candidate = userRepository.findByEmail("cache-candidate@example.com").orElseGet(() -> {
            User u = new User();
            u.setName("Cache Candidate");
            u.setEmail("cache-candidate@example.com");
            u.setPassword("$2a$10$irrelevant");
            u.setRole(UserRole.CANDIDATE);
            return userRepository.save(u);
        });

        InterviewProcess process = processRepository.findAll().stream()
                .filter(p -> p.getTechnology().equals("CacheTest"))
                .findFirst()
                .orElseGet(() -> {
                    InterviewProcess p = new InterviewProcess();
                    p.setCandidateId(candidate.getId());
                    p.setClientId(client.getId());
                    p.setMarketerId(admin.getId());
                    p.setTechnology("CacheTest");
                    return processRepository.save(p);
                });

        InterviewSession session = sessionRepository.findByProcessIdOrderByRound(process.getId())
                .stream().findFirst()
                .orElseGet(() -> {
                    InterviewSession s = new InterviewSession();
                    s.setProcessId(process.getId());
                    s.setSupporterId(supporter.getId());
                    s.setRound("Round 1");
                    s.setMode("Video");
                    s.setDurationMinutes(45);
                    s.setScheduledAt(Instant.now().plus(3, ChronoUnit.DAYS));
                    return sessionRepository.save(s);
                });
        sessionId = session.getId();

        question1Id = questionRepository.findAll().stream()
                .filter(q -> q.getTopic().equals("CacheQ1") && q.getClientId().equals(client.getId()))
                .findFirst()
                .map(Question::getId)
                .orElseGet(() -> {
                    Question q = new Question();
                    q.setClientId(client.getId());
                    q.setTopic("CacheQ1");
                    q.setRound("Technical");
                    q.setBody("Cache question body 1");
                    q.setCreatedBy(admin.getId());
                    return questionRepository.save(q).getId();
                });

        question2Id = questionRepository.findAll().stream()
                .filter(q -> q.getTopic().equals("CacheQ2") && q.getClientId().equals(client.getId()))
                .findFirst()
                .map(Question::getId)
                .orElseGet(() -> {
                    Question q = new Question();
                    q.setClientId(client.getId());
                    q.setTopic("CacheQ2");
                    q.setRound("Behavioral");
                    q.setBody("Cache question body 2");
                    q.setCreatedBy(admin.getId());
                    return questionRepository.save(q).getId();
                });

        // Ensure a clean state for session_questions for this session
        sessionQuestionRepository.findBySessionIdOrderByDisplayOrder(sessionId)
                .forEach(sq -> sessionQuestionRepository.deleteById(sq.getId()));
    }

    @Test
    @WithMockUser(roles = "ADMIN")
    @DisplayName("session question list is served from Redis cache on repeated reads")
    void listBySessionServesFromCache() {
        // Seed one link via repository (bypasses cache)
        SessionQuestion sq = new SessionQuestion();
        sq.setSessionId(sessionId);
        sq.setQuestionId(question1Id);
        sessionQuestionRepository.save(sq);

        // First service call — hits DB, populates cache
        List<SessionQuestionResponse> first = sessionQuestionService.listBySession(sessionId);
        assertThat(first).hasSize(1);
        assertThat(first.get(0).questionId()).isEqualTo(question1Id);

        // Insert a second link directly via repository, bypassing the service (no cache eviction)
        SessionQuestion sq2 = new SessionQuestion();
        sq2.setSessionId(sessionId);
        sq2.setQuestionId(question2Id);
        sessionQuestionRepository.save(sq2);

        // Second service call — should return cached result (still 1, not 2)
        List<SessionQuestionResponse> second = sessionQuestionService.listBySession(sessionId);
        assertThat(second).hasSize(1)
                .as("Cache hit: direct DB insert is not visible until cache is evicted");
    }

    @Test
    @WithMockUser(roles = "ADMIN")
    @DisplayName("cache is evicted on unlink, next read reflects current DB state")
    void cacheEvictedOnUnlink() {
        // Seed both links via repository
        SessionQuestion sq1 = new SessionQuestion();
        sq1.setSessionId(sessionId);
        sq1.setQuestionId(question1Id);
        sessionQuestionRepository.save(sq1);

        SessionQuestion sq2 = new SessionQuestion();
        sq2.setSessionId(sessionId);
        sq2.setQuestionId(question2Id);
        sessionQuestionRepository.save(sq2);

        // First call populates cache with 2 items
        List<SessionQuestionResponse> cached = sessionQuestionService.listBySession(sessionId);
        assertThat(cached).hasSize(2);

        // Unlink question1 via service — triggers @CacheEvict
        sessionQuestionService.unlink(sessionId, question1Id);

        // Next call must hit DB and return fresh data
        List<SessionQuestionResponse> fresh = sessionQuestionService.listBySession(sessionId);
        assertThat(fresh).hasSize(1);
        assertThat(fresh.get(0).questionId()).isEqualTo(question2Id);
    }

    @Test
    @WithMockUser(roles = "ADMIN")
    @DisplayName("cache is evicted on link, next read reflects current DB state")
    void cacheEvictedOnLink() {
        // Seed one link, populate cache
        SessionQuestion sq1 = new SessionQuestion();
        sq1.setSessionId(sessionId);
        sq1.setQuestionId(question1Id);
        sessionQuestionRepository.save(sq1);

        List<SessionQuestionResponse> before = sessionQuestionService.listBySession(sessionId);
        assertThat(before).hasSize(1);

        // Link via service — triggers @CacheEvict
        sessionQuestionService.link(sessionId, new LinkQuestionRequest(question2Id, 2, null));

        // Next read must reflect 2 links
        List<SessionQuestionResponse> after = sessionQuestionService.listBySession(sessionId);
        assertThat(after).hasSize(2);
    }
}
