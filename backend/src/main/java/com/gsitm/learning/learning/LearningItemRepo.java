package com.gsitm.learning.learning;

import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;

public interface LearningItemRepo extends JpaRepository<LearningItem, Long> {
    List<LearningItem> findByCourseModuleIdInOrderBySequenceNo(List<Long> moduleIds);
    List<LearningItem> findByContentId(Long contentId);
}
