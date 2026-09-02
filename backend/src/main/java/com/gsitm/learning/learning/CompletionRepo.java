package com.gsitm.learning.learning;

import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;

public interface CompletionRepo extends JpaRepository<LearningItemCompletion, Long> {
    List<LearningItemCompletion> findByEnrollmentId(Long enrollmentId);
    boolean existsByEnrollmentIdAndLearningItemId(Long enrollmentId, Long learningItemId);
}
