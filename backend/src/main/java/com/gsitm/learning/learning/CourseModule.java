package com.gsitm.learning.learning;

import jakarta.persistence.*;

@Entity
@Table(name = "course_module")
public class CourseModule {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "course_id", nullable = false)
    private Long courseId;

    @Column(name = "sequence_no", nullable = false)
    private int sequenceNo;

    @Column(nullable = false)
    private String title;

    protected CourseModule() {}

    public CourseModule(Long courseId, int sequenceNo, String title) {
        this.courseId = courseId;
        this.sequenceNo = sequenceNo;
        this.title = title;
    }

    public Long getId() { return id; }
    public Long getCourseId() { return courseId; }
    public int getSequenceNo() { return sequenceNo; }
    public String getTitle() { return title; }
}
