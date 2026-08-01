package xyz.catuns.imp.api.question.repository;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import xyz.catuns.imp.api.question.entity.Question;

import java.util.UUID;

public interface QuestionRepository extends JpaRepository<Question, UUID>, JpaSpecificationExecutor<Question> {

    @Query(
            value = "SELECT * FROM questions q WHERE q.is_active = true " +
                    "AND (:clientId IS NULL OR q.end_client_id = :clientId) " +
                    "AND q.search_vector @@ plainto_tsquery('english', :q) " +
                    "ORDER BY ts_rank(q.search_vector, plainto_tsquery('english', :q)) DESC",
            countQuery = "SELECT count(*) FROM questions q WHERE q.is_active = true " +
                    "AND (:clientId IS NULL OR q.end_client_id = :clientId) " +
                    "AND q.search_vector @@ plainto_tsquery('english', :q)",
            nativeQuery = true
    )
    Page<Question> searchByFullText(@Param("q") String q, @Param("clientId") UUID clientId, Pageable pageable);
}
