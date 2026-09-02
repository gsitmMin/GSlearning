package com.gsitm.learning.learning;

import jakarta.persistence.*;
import java.time.LocalDate;

@Entity
@Table(name = "course")
public class Course {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, unique = true)
    private String code;

    @Column(nullable = false)
    private String title;

    @Column(nullable = false)
    private String description = "";

    @Column(nullable = false)
    private boolean mandatory;

    @Column(name = "publish_status", nullable = false)
    private String publishStatus = "PUBLISHED";

    @Transient
    private LocalDate defaultDueOn; // 배정 시 기본 기한 (엔티티 비영속 — 배정 요청에서 사용)

    protected Course() {}

    public Course(String code, String title, String description, boolean mandatory) {
        this.code = code;
        this.title = title;
        this.description = description;
        this.mandatory = mandatory;
    }

    public Long getId() { return id; }
    public String getCode() { return code; }
    public String getTitle() { return title; }
    public String getDescription() { return description; }
    public boolean isMandatory() { return mandatory; }
}
