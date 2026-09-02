package com.gsitm.learning.learning;

import jakarta.persistence.*;
import java.time.Instant;
import java.time.LocalDate;

@Entity
@Table(name = "enrollment")
public class Enrollment {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "course_id", nullable = false)
    private Long courseId;

    @Column(name = "employee_id", nullable = false)
    private Long employeeId;

    @Column(nullable = false)
    private String status = "ENROLLED";

    @Column(name = "assigned_by")
    private Long assignedBy;

    @Column(name = "due_on")
    private LocalDate dueOn;

    @Column(name = "enrolled_at", insertable = false, updatable = false)
    private Instant enrolledAt;

    @Column(name = "completed_at")
    private Instant completedAt;

    protected Enrollment() {}

    public Enrollment(Long courseId, Long employeeId, Long assignedBy, LocalDate dueOn) {
        this.courseId = courseId;
        this.employeeId = employeeId;
        this.assignedBy = assignedBy;
        this.dueOn = dueOn;
    }

    public Long getId() { return id; }
    public Long getCourseId() { return courseId; }
    public Long getEmployeeId() { return employeeId; }
    public String getStatus() { return status; }
    public LocalDate getDueOn() { return dueOn; }

    public void markInProgress() {
        if ("ENROLLED".equals(status)) status = "IN_PROGRESS";
    }
    /** FR-K-06: 필수 항목 전부 완료 시 */
    public void markCompleted() {
        if (!"COMPLETED".equals(status)) {
            status = "COMPLETED";
            completedAt = Instant.now();
        }
    }
}
