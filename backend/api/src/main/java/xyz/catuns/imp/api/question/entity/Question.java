package xyz.catuns.imp.api.question.entity;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "questions")
@Getter
@Setter
public class Question {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(name = "end_client_id", nullable = false)
    private UUID clientId;

    @Column(name = "topic", nullable = false)
    private String topic;

    @Column(name = "round", nullable = false)
    private String round;

    @Column(name = "body", nullable = false, columnDefinition = "text")
    private String body;

    @Column(name = "version", nullable = false)
    private int version = 1;

    @Column(name = "is_active", nullable = false)
    private boolean active = true;

    // search_vector is managed by the DB trigger — never written by JPA
    @Column(name = "search_vector", insertable = false, updatable = false)
    private String searchVector;

    @Column(name = "created_by", nullable = false)
    private UUID createdBy;

    @Column(name = "updated_by")
    private UUID updatedBy;

    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at", nullable = false)
    private Instant updatedAt;
}
