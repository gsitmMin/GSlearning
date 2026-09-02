package com.gsitm.learning.learning;

import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;

public interface ProgressIntervalRepo extends JpaRepository<VideoProgressInterval, Long> {
    List<VideoProgressInterval> findByVideoProgressId(Long videoProgressId);

    @Modifying
    @Query("delete from VideoProgressInterval i where i.videoProgressId = :videoProgressId")
    void deleteByVideoProgressId(Long videoProgressId);
}
