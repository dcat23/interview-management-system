package xyz.catuns.imp.api.question.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import xyz.catuns.imp.api.question.entity.QuestionVersion;

import java.util.List;
import java.util.UUID;

public interface QuestionVersionRepository extends JpaRepository<QuestionVersion, UUID> {
    List<QuestionVersion> findByQuestionIdOrderByVersionDesc(UUID questionId);
}
