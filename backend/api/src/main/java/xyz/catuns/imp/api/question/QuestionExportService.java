package xyz.catuns.imp.api.question;

import java.util.ArrayList;
import java.util.Comparator;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.TreeMap;
import java.util.UUID;
import java.util.stream.Collectors;

import org.springframework.data.domain.Sort;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import lombok.RequiredArgsConstructor;
import xyz.catuns.imp.api.client.entity.Client;
import xyz.catuns.imp.api.client.repository.ClientRepository;
import xyz.catuns.imp.api.question.entity.Question;
import xyz.catuns.imp.api.question.repository.QuestionRepository;

/**
 * Renders the active question bank as a Markdown document, either grouped by client and then
 * topic, or by topic and then client. Client names are resolved in a single {@code findAllById}
 * batch rather than per-question, to avoid N+1 lookups while building the export.
 */
@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class QuestionExportService {

    private static final Sort EXPORT_SORT = Sort.by("clientId").ascending().and(Sort.by("topic").ascending());

    private final QuestionRepository questionRepository;
    private final ClientRepository clientRepository;

    /**
     * {@code ## Client name} headers, with each client's questions grouped under {@code ### Topic}.
     */
    @PreAuthorize("hasAnyRole('ADMIN','MARKETER','SUPPORTER','AI_AGENT')")
    public String exportByClient(UUID clientId) {
        List<Question> questions = findActiveQuestions(clientId);
        Map<UUID, String> clientNames = resolveClientNames(questions);

        Map<UUID, List<Question>> byClient = questions.stream()
                .collect(Collectors.groupingBy(Question::getClientId, LinkedHashMap::new, Collectors.toList()));

        List<UUID> orderedClientIds = new ArrayList<>(byClient.keySet());
        orderedClientIds.sort(Comparator.comparing(
                id -> clientNames.getOrDefault(id, ""), String.CASE_INSENSITIVE_ORDER));

        StringBuilder md = new StringBuilder("# Question Bank Export\n\n");
        if (orderedClientIds.isEmpty()) {
            return md.append("_No questions found._\n").toString();
        }

        for (UUID id : orderedClientIds) {
            md.append("## ").append(clientNames.getOrDefault(id, "Unknown client")).append("\n\n");

            Map<String, List<Question>> byTopic = byClient.get(id).stream()
                    .collect(Collectors.groupingBy(Question::getTopic, TreeMap::new, Collectors.toList()));

            for (Map.Entry<String, List<Question>> topicEntry : byTopic.entrySet()) {
                md.append("### ").append(topicEntry.getKey()).append("\n\n");
                appendQuestions(md, topicEntry.getValue());
            }
        }

        return md.toString();
    }

    /**
     * {@code ## Topic} headers, with each topic's questions grouped under {@code ### Client name}.
     */
    @PreAuthorize("hasAnyRole('ADMIN','MARKETER','SUPPORTER','AI_AGENT')")
    public String exportByTopic(UUID clientId) {
        List<Question> questions = findActiveQuestions(clientId);
        Map<UUID, String> clientNames = resolveClientNames(questions);

        Map<String, List<Question>> byTopic = questions.stream()
                .collect(Collectors.groupingBy(Question::getTopic, TreeMap::new, Collectors.toList()));

        StringBuilder md = new StringBuilder("# Question Bank Export\n\n");
        if (byTopic.isEmpty()) {
            return md.append("_No questions found._\n").toString();
        }

        for (Map.Entry<String, List<Question>> topicEntry : byTopic.entrySet()) {
            md.append("## ").append(topicEntry.getKey()).append("\n\n");

            Map<UUID, List<Question>> byClient = topicEntry.getValue().stream()
                    .collect(Collectors.groupingBy(Question::getClientId, LinkedHashMap::new, Collectors.toList()));

            List<UUID> orderedClientIds = new ArrayList<>(byClient.keySet());
            orderedClientIds.sort(Comparator.comparing(
                    id -> clientNames.getOrDefault(id, ""), String.CASE_INSENSITIVE_ORDER));

            for (UUID id : orderedClientIds) {
                md.append("### ").append(clientNames.getOrDefault(id, "Unknown client")).append("\n\n");
                appendQuestions(md, byClient.get(id));
            }
        }

        return md.toString();
    }

    private List<Question> findActiveQuestions(UUID clientId) {
        Specification<Question> spec = (root, query, cb) -> cb.isTrue(root.get("active"));
        if (clientId != null) {
            spec = spec.and((root, query, cb) -> cb.equal(root.get("clientId"), clientId));
        }
        return questionRepository.findAll(spec, EXPORT_SORT);
    }

    private Map<UUID, String> resolveClientNames(List<Question> questions) {
        List<UUID> clientIds = questions.stream().map(Question::getClientId).distinct().toList();
        return clientRepository.findAllById(clientIds).stream()
                .collect(Collectors.toMap(Client::getId, Client::getName));
    }

    private void appendQuestions(StringBuilder md, List<Question> questions) {
        for (Question question : questions) {
            md.append("- **[").append(question.getRound()).append("]** ")
                    .append(question.getBody().replace("\n", " ").trim())
                    .append("\n");
        }
        md.append("\n");
    }
}
