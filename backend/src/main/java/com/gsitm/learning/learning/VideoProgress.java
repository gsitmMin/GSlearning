package com.gsitm.learning.learning;

import jakarta.persistence.*;
import java.math.BigDecimal;
import java.time.Instant;

@Entity
@Table(name = "video_progress")
public class VideoProgress {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "employee_id", nullable = false)
    private Long employeeId;

    @Column(name = "content_id", nullable = false)
    private Long contentId;

    @Column(name = "watched_sec", nullable = false)
    private int watchedSec;

    @Column(name = "progress_percent", nullable = false)
    private BigDecimal progressPercent = BigDecimal.ZERO;

    @Column(name = "last_position_sec", nullable = false)
    private int lastPositionSec;

    @Column(nullable = false)
    private boolean completed;

    @Column(name = "first_started_at")
    private Instant firstStartedAt;

    @Column(name = "last_watched_at")
    private Instant lastWatchedAt;

    protected VideoProgress() {}

    public VideoProgress(Long employeeId, Long contentId) {
        this.employeeId = employeeId;
        this.contentId = contentId;
        this.firstStartedAt = Instant.now();
    }

    public Long getId() { return id; }
    public Long getEmployeeId() { return employeeId; }
    public Long getContentId() { return contentId; }
    public int getWatchedSec() { return watchedSec; }
    public BigDecimal getProgressPercent() { return progressPercent; }
    public int getLastPositionSec() { return lastPositionSec; }
    public boolean isCompleted() { return completed; }
    public Instant getLastWatchedAt() { return lastWatchedAt; }

    public void update(double watchedSec, double percent, int lastPositionSec) {
        this.watchedSec = (int) Math.round(watchedSec);
        this.progressPercent = BigDecimal.valueOf(percent);
        this.lastPositionSec = lastPositionSec;
        // 완료 되돌림 금지 (§7.3)
        this.completed = this.completed || percent >= ProgressLogic.COMPLETE_PERCENT;
        this.lastWatchedAt = Instant.now();
    }

    public void touchReport() { this.lastWatchedAt = Instant.now(); }
}
