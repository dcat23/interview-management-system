package xyz.catuns.imp.api.session.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import xyz.catuns.imp.api.session.entity.StatusHistory;

import java.util.List;
import java.util.UUID;

@Repository
public interface StatusHistoryRepository extends JpaRepository<StatusHistory, UUID> {

    List<StatusHistory> findBySessionIdOrderByChangedAtAsc(UUID sessionId);
}
