package com.gsitm.learning.content;

import jakarta.persistence.*;

/** 접근범위 — ALL(전사) / ORGANIZATION / EXPLICIT (PRD ACL 3단계) */
@Entity
@Table(name = "content_access")
public class ContentAccess {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "content_id", nullable = false)
    private Long contentId;

    @Column(nullable = false)
    private String scope;

    @Column(name = "organization_id")
    private Long organizationId;

    @Column(name = "employee_id")
    private Long employeeId;

    protected ContentAccess() {}

    public static ContentAccess all(Long contentId) {
        var a = new ContentAccess();
        a.contentId = contentId;
        a.scope = "ALL";
        return a;
    }
}
