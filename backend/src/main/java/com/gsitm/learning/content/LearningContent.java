package com.gsitm.learning.content;

import jakarta.persistence.*;
import java.time.Instant;

@Entity
@Table(name = "learning_content")
public class LearningContent {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    /** API 노출 식별자 (CONT-001) — Vimeo ID와 분리 (PRD §12 확장훅 1) */
    @Column(nullable = false, unique = true)
    private String code;

    @Column(name = "source_type", nullable = false)
    private String sourceType = "INTERNAL_VIMEO";

    @Column(nullable = false)
    private String title;

    @Column(nullable = false)
    private String description = "";

    @Column(name = "duration_sec", nullable = false)
    private int durationSec;

    @Column(nullable = false)
    private String language = "ko";

    @Column(nullable = false)
    private String difficulty = "입문";

    @Column(name = "publish_status", nullable = false)
    private String publishStatus = "DRAFT";

    @Column(name = "availability_status", nullable = false)
    private String availabilityStatus = "AVAILABLE";

    @Column(name = "created_by")
    private Long createdBy;

    @Column(name = "created_at", insertable = false, updatable = false)
    private Instant createdAt;

    protected LearningContent() {}

    public LearningContent(String code, String title, String description, int durationSec, Long createdBy) {
        this.code = code;
        this.title = title;
        this.description = description;
        this.durationSec = durationSec;
        this.createdBy = createdBy;
    }

    public Long getId() { return id; }
    public String getCode() { return code; }
    public String getSourceType() { return sourceType; }
    public String getTitle() { return title; }
    public String getDescription() { return description; }
    public int getDurationSec() { return durationSec; }
    public String getDifficulty() { return difficulty; }
    public String getPublishStatus() { return publishStatus; }
    public String getAvailabilityStatus() { return availabilityStatus; }
    public Instant getCreatedAt() { return createdAt; }

    public boolean isVisibleToLearner() {
        return "PUBLISHED".equals(publishStatus) && "AVAILABLE".equals(availabilityStatus);
    }
    /** 관리자 메타데이터 수정 — Vimeo 원본과 독립 (FR-C-05) */
    public void updateMeta(String title, String description, String difficulty) {
        if (title != null && !title.isBlank()) this.title = title;
        if (description != null) this.description = description;
        if (difficulty != null && !difficulty.isBlank()) this.difficulty = difficulty;
    }

    public void publish() { this.publishStatus = "PUBLISHED"; }
    public void markRemoved() { this.availabilityStatus = "REMOVED"; }
}
