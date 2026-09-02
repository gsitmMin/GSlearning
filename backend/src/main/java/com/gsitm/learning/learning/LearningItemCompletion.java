package com.gsitm.learning.learning;

import jakarta.persistence.*;
import java.time.Instant;

@Entity
@Table(name = "learning_item_completion")
public class LearningItemCompletion {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "enrollment_id", nullable = false)
    private Long enrollmentId;

    @Column(name = "learning_item_id", nullable = false)
    private Long learningItemId;

    @Column(name = "completed_at", insertable = false, updatable = false)
    private Instant completedAt;

    protected LearningItemCompletion() {}

    public LearningItemCompletion(Long enrollmentId, Long learningItemId) {
        this.enrollmentId = enrollmentId;
        this.learningItemId = learningItemId;
    }

    public Long getLearningItemId() { return learningItemId; }
}
