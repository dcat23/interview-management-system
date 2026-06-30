package xyz.catuns.imp.api.process.entity;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.Type;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "interview_processes")
@Getter
@Setter
@NoArgsConstructor
public class InterviewProcess {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(name = "candidate_id", nullable = false)
    private UUID candidateId;

    @Column(name = "end_client_id", nullable = false)
    private UUID clientId;

    @Column(name = "marketer_id", nullable = false)
    private UUID marketerId;

    @Column(name = "technology", nullable = false)
    private String technology;

    @Column(name = "description")
    private String description;

    @Type(ProcessStatusType.class)
    @Column(name = "status", nullable = false)
    private ProcessStatus status = ProcessStatus.ACTIVE;

    @Column(name = "started_at", nullable = false, updatable = false)
    private Instant startedAt = Instant.now();

    @Column(name = "closed_at")
    private Instant closedAt;

    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at", nullable = false)
    private Instant updatedAt;
}
