package com.gsitm.learning.audit;

import java.util.Map;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Propagation;
import org.springframework.transaction.annotation.Transactional;
import com.fasterxml.jackson.databind.ObjectMapper;

/**
 * 감사 로그 — FR-X-01.
 * 본 트랜잭션이 롤백돼도 감사 기록(로그인 실패 등)은 남아야 하므로 REQUIRES_NEW.
 */
@Service
public class AuditService {
    private final JdbcTemplate jdbc;
    private final ObjectMapper om;

    public AuditService(JdbcTemplate jdbc, ObjectMapper om) {
        this.jdbc = jdbc;
        this.om = om;
    }

    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public void record(Long actorAccountId, String actorEmployeeNo, String action,
                       String entityType, String entityId, Map<String, Object> detail,
                       String ip, String userAgent) {
        try {
            jdbc.update("""
                INSERT INTO audit_log
                  (actor_account_id, actor_employee_no, action, entity_type, entity_id, detail, ip, user_agent)
                VALUES (?, ?, ?, ?, ?, ?::jsonb, ?, ?)
                """,
                actorAccountId, actorEmployeeNo, action, entityType, entityId,
                detail == null ? null : om.writeValueAsString(detail),
                ip, userAgent);
        } catch (Exception e) {
            // 감사 실패가 본 기능을 막지 않도록 삼킴 (단, 로그는 남김)
            org.slf4j.LoggerFactory.getLogger(AuditService.class)
                .error("audit_log insert failed: action={}", action, e);
        }
    }
}
