package com.gsitm.learning.learning;

import java.util.List;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;

public interface EnrollmentRepo extends JpaRepository<Enrollment, Long> {
    List<Enrollment> findByEmployeeId(Long employeeId);
    Optional<Enrollment> findByCourseIdAndEmployeeId(Long courseId, Long employeeId);
}
