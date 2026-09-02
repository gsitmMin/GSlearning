package com.gsitm.learning.learning;

import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;

public interface CourseRepo extends JpaRepository<Course, Long> {
    Optional<Course> findByCode(String code);
}
