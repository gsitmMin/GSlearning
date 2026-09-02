package com.gsitm.learning.learning;

import jakarta.persistence.*;
import java.math.BigDecimal;

@Entity
@Table(name = "video_progress_interval")
public class VideoProgressInterval {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "video_progress_id", nullable = false)
    private Long videoProgressId;

    @Column(name = "start_sec", nullable = false)
    private BigDecimal startSec;

    @Column(name = "end_sec", nullable = false)
    private BigDecimal endSec;

    protected VideoProgressInterval() {}

    public VideoProgressInterval(Long videoProgressId, double startSec, double endSec) {
        this.videoProgressId = videoProgressId;
        this.startSec = BigDecimal.valueOf(Math.round(startSec * 100) / 100.0);
        this.endSec = BigDecimal.valueOf(Math.round(endSec * 100) / 100.0);
    }

    public Interval toInterval() {
        return new Interval(startSec.doubleValue(), endSec.doubleValue());
    }
}
