package xyz.catuns.imp.api.session.entity;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.Type;

import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "status_history")
@Getter
@Setter
@NoArgsConstructor
public class StatusHistory {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(name = "session_id", nullable = false)
    private UUID sessionId;

    @Type(SessionStatusType.class)
    @Column(name = "from_status")
    private SessionStatus fromStatus;

    @Type(SessionStatusType.class)
    @Column(name = "to_status", nullable = false)
    private SessionStatus toStatus;

    @Column(name = "changed_by")
    private UUID changedBy;

    @Type(ChangeSourceType.class)
    @Column(name = "change_source", nullable = false)
    private ChangeSource changeSource;

    @CreationTimestamp
    @Column(name = "changed_at", nullable = false, updatable = false)
    private Instant changedAt;
}
