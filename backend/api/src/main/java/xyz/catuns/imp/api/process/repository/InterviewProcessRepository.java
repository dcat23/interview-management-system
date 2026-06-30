package xyz.catuns.imp.api.process.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.stereotype.Repository;
import xyz.catuns.imp.api.process.entity.InterviewProcess;

import java.util.UUID;

@Repository
public interface InterviewProcessRepository extends JpaRepository<InterviewProcess, UUID>, JpaSpecificationExecutor<InterviewProcess> {
}
