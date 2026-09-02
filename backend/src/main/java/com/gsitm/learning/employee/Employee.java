package com.gsitm.learning.employee;

import jakarta.persistence.*;
import java.time.Instant;
import java.time.LocalDate;

/**
 * 직원 마스터. Source of Truth는 향후 HR 시스템 (source 컬럼으로 구분).
 * employee_no가 외부 연동 매칭 키 — PRD FR-E-02.
 */
@Entity
@Table(name = "employee")
public class Employee {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "employee_no", nullable = false, unique = true)
    private String employeeNo;

    @Column(nullable = false)
    private String name;

    @Column(nullable = false, unique = true)
    private String email;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "organization_id", nullable = false)
    private Organization organization;

    @Column(name = "manager_id")
    private Long managerId;

    private String position;

    @Column(name = "employment_status", nullable = false)
    private String employmentStatus = "ACTIVE";

    @Column(name = "hired_on")
    private LocalDate hiredOn;

    @Column(nullable = false)
    private String source = "MANUAL";

    @Column(name = "created_at", insertable = false, updatable = false)
    private Instant createdAt;

    @Column(name = "updated_at", insertable = false, updatable = false)
    private Instant updatedAt;

    protected Employee() {}

    public Long getId() { return id; }
    public String getEmployeeNo() { return employeeNo; }
    public String getName() { return name; }
    public String getEmail() { return email; }
    public Organization getOrganization() { return organization; }
    public String getPosition() { return position; }
    public String getEmploymentStatus() { return employmentStatus; }
    public boolean isActive() { return "ACTIVE".equals(employmentStatus); }
}
