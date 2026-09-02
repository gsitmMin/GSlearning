package com.gsitm.learning.content;

import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;

public interface ContentSegmentRepo extends JpaRepository<ContentSegment, Long> {
    List<ContentSegment> findByContentIdOrderBySequenceNo(Long contentId);

    @Modifying
    @Query("delete from ContentSegment s where s.contentId = :contentId")
    void deleteByContentId(Long contentId);
}
