package xyz.catuns.imp.api.feedback.entity;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "feedback")
@Getter
@Setter
@NoArgsConstructor
public class Feedback {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(name = "session_id", nullable = false, unique = true)
    private UUID sessionId;

    @Column(name = "supporter_id", nullable = false)
    private UUID supporterId;

    @Column(name = "body", nullable = false)
    private String body = "";

    @Column(name = "is_submitted", nullable = false)
    private boolean submitted = false;

    @Column(name = "submitted_at")
    private Instant submittedAt;

    @UpdateTimestamp
    @Column(name = "updated_at", nullable = false)
    private Instant updatedAt;
}
