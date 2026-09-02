package com.gsitm.learning.learning;

import java.util.List;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;

public interface VideoProgressRepo extends JpaRepository<VideoProgress, Long> {
    Optional<VideoProgress> findByEmployeeIdAndContentId(Long employeeId, Long contentId);
    List<VideoProgress> findByEmployeeId(Long employeeId);
}
