package com.gsitm.learning.learning;

import jakarta.persistence.*;

@Entity
@Table(name = "learning_item")
public class LearningItem {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "course_module_id", nullable = false)
    private Long courseModuleId;

    @Column(name = "sequence_no", nullable = false)
    private int sequenceNo;

    @Column(name = "item_type", nullable = false)
    private String itemType = "VIDEO";

    @Column(name = "content_id", nullable = false)
    private Long contentId;

    @Column(nullable = false)
    private boolean required = true;

    @Column(name = "min_progress_percent", nullable = false)
    private int minProgressPercent = 90;

    protected LearningItem() {}

    public LearningItem(Long courseModuleId, int sequenceNo, Long contentId,
                        boolean required, int minProgressPercent) {
        this.courseModuleId = courseModuleId;
        this.sequenceNo = sequenceNo;
        this.contentId = contentId;
        this.required = required;
        this.minProgressPercent = minProgressPercent;
    }

    public Long getId() { return id; }
    public Long getCourseModuleId() { return courseModuleId; }
    public int getSequenceNo() { return sequenceNo; }
    public Long getContentId() { return contentId; }
    public boolean isRequired() { return required; }
    public int getMinProgressPercent() { return minProgressPercent; }
}
