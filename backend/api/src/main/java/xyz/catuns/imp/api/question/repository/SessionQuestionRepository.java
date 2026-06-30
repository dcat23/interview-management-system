package xyz.catuns.imp.api.question.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import xyz.catuns.imp.api.question.entity.SessionQuestion;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface SessionQuestionRepository extends JpaRepository<SessionQuestion, UUID> {
    List<SessionQuestion> findBySessionIdOrderByDisplayOrder(UUID sessionId);
    Optional<SessionQuestion> findBySessionIdAndQuestionId(UUID sessionId, UUID questionId);
    boolean existsBySessionIdAndQuestionId(UUID sessionId, UUID questionId);
}
