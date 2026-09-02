package com.gsitm.learning.content;

import jakarta.persistence.*;

@Entity
@Table(name = "content_segment")
public class ContentSegment {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "content_id", nullable = false)
    private Long contentId;

    @Column(name = "sequence_no", nullable = false)
    private int sequenceNo;

    @Column(name = "start_sec", nullable = false)
    private int startSec;

    @Column(name = "end_sec", nullable = false)
    private int endSec;

    @Column(nullable = false)
    private String title;

    private String summary;

    @Column(name = "created_by")
    private Long createdBy;

    protected ContentSegment() {}

    public ContentSegment(Long contentId, int sequenceNo, int startSec, int endSec,
                          String title, String summary, Long createdBy) {
        this.contentId = contentId;
        this.sequenceNo = sequenceNo;
        this.startSec = startSec;
        this.endSec = endSec;
        this.title = title;
        this.summary = summary;
        this.createdBy = createdBy;
    }

    public Long getId() { return id; }
    public Long getContentId() { return contentId; }
    public int getSequenceNo() { return sequenceNo; }
    public int getStartSec() { return startSec; }
    public int getEndSec() { return endSec; }
    public String getTitle() { return title; }
    public String getSummary() { return summary; }
}
