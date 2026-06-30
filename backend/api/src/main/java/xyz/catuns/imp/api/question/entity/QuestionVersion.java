package xyz.catuns.imp.api.question.entity;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;
import org.hibernate.annotations.CreationTimestamp;

import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "question_versions")
@Getter
@Setter
public class QuestionVersion {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(name = "question_id", nullable = false)
    private UUID questionId;

    @Column(name = "version", nullable = false)
    private int version;

    @Column(name = "topic", nullable = false)
    private String topic;

    @Column(name = "round", nullable = false)
    private String round;

    @Column(name = "body", nullable = false, columnDefinition = "text")
    private String body;

    @Column(name = "updated_by")
    private UUID updatedBy;

    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt;
}
