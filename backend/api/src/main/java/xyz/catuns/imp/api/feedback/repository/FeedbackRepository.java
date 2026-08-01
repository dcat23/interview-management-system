package xyz.catuns.imp.api.feedback.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import xyz.catuns.imp.api.feedback.entity.Feedback;

import java.util.Optional;
import java.util.UUID;

@Repository
public interface FeedbackRepository extends JpaRepository<Feedback, UUID> {

    Optional<Feedback> findBySessionId(UUID sessionId);

    boolean existsBySessionId(UUID sessionId);
}
