package xyz.catuns.imp.api.process.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;
import xyz.catuns.imp.api.process.entity.InterviewProcess;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface InterviewProcessRepository extends JpaRepository<InterviewProcess, UUID>, JpaSpecificationExecutor<InterviewProcess> {

    Optional<InterviewProcess> findByCandidateIdAndClientIdAndJobId(UUID candidateId, UUID clientId, String jobId);

    Optional<InterviewProcess> findByCandidateIdAndClientIdAndTechnologyIgnoreCase(UUID candidateId, UUID clientId, String technology);

    /**
     * Distinct technologies, ranked most-used first. Case/whitespace variants collapse into one
     * entry; MIN picks a stable spelling for the group.
     */
    @Query("SELECT MIN(TRIM(p.technology)) FROM InterviewProcess p WHERE TRIM(p.technology) <> '' "
            + "GROUP BY LOWER(TRIM(p.technology)) ORDER BY COUNT(p) DESC, MIN(TRIM(p.technology))")
    List<String> findDistinctTechnologiesByUsage();
}
