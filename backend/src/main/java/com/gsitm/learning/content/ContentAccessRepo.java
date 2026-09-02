package com.gsitm.learning.content;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

public interface ContentAccessRepo extends JpaRepository<ContentAccess, Long> {
    @Query("""
        select count(a) > 0 from ContentAccess a
        where a.contentId = :contentId and (
            a.scope = 'ALL'
            or (a.scope = 'ORGANIZATION' and a.organizationId = :organizationId)
            or (a.scope = 'EXPLICIT' and a.employeeId = :employeeId)
        )
        """)
    boolean canAccess(Long contentId, Long organizationId, Long employeeId);
}
