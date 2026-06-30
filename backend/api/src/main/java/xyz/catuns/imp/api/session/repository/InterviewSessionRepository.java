package xyz.catuns.imp.api.session.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import xyz.catuns.imp.api.session.entity.InterviewSession;

import java.util.List;
import java.util.UUID;

@Repository
public interface InterviewSessionRepository extends JpaRepository<InterviewSession, UUID> {

    List<InterviewSession> findByProcessIdOrderByRound(UUID processId);

    List<InterviewSession> findByProcessIdAndSupporterIdOrderByRound(UUID processId, UUID supporterId);
}
