package com.gsitm.learning.content;

import java.util.List;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;

public interface ContentRepo extends JpaRepository<LearningContent, Long> {
    Optional<LearningContent> findByCode(String code);
    List<LearningContent> findAllByOrderByIdAsc();
}
