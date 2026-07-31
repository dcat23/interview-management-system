package xyz.catuns.imp.api.process.entity;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.Type;
import org.hibernate.annotations.UpdateTimestamp;
import xyz.catuns.imp.api.client.entity.Client;
import xyz.catuns.imp.api.session.entity.InterviewSession;
import xyz.catuns.imp.api.user.entity.User;

import java.time.Instant;
import java.util.ArrayList;
import java.util.List;
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

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "candidate_id", insertable = false, updatable = false)
    private User candidate;

    @Column(name = "end_client_id", nullable = false)
    private UUID clientId;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "end_client_id", insertable = false, updatable = false)
    private Client client;

    @Column(name = "marketer_id", nullable = false)
    private UUID marketerId;

    @Column(name = "technology", nullable = false)
    private String technology;

    @Column(name = "job_id")
    private String jobId;

    @Column(name = "description")
    private String description;

    @Type(ProcessStatusType.class)
    @Column(name = "status", nullable = false)
    private ProcessStatus status = ProcessStatus.ACTIVE;

    @Column(name = "started_at", nullable = false)
    private Instant startedAt = Instant.now();

    @Column(name = "closed_at")
    private Instant closedAt;

    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at", nullable = false)
    private Instant updatedAt;

    @OneToMany(mappedBy = "process", fetch = FetchType.LAZY)
    private List<InterviewSession> sessions = new ArrayList<>();
}
