package com.gsitm.learning.learning;

import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;

public interface CourseModuleRepo extends JpaRepository<CourseModule, Long> {
    List<CourseModule> findByCourseIdOrderBySequenceNo(Long courseId);
}
