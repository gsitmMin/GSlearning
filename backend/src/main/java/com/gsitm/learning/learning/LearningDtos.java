package com.gsitm.learning.learning;

import java.util.List;
import java.util.Map;

public final class LearningDtos {
    private LearningDtos() {}

    public record IntervalDto(double start, double end) {}

    public record ProgressReport(
        List<IntervalDto> intervals, Double lastPosition, Double playbackRate, Long clientSentAt) {}

    /** 프로토타입 VideoProgress 타입과 동일 형태 (contentId = code) */
    public record ProgressView(
        String contentId, List<IntervalDto> intervals, int watchedSec,
        double percent, int lastPositionSec, boolean completed, long updatedAt) {}

    public record RejectedDto(IntervalDto interval, String reason) {}

    public record ProgressResponse(ProgressView progress, List<RejectedDto> rejected) {}

    public record PlayerInfo(
        String providerVideoId, String embedHash, int durationSec,
        Map<String, Object> embedOptions, int resumeAt,
        List<com.gsitm.learning.content.ContentDtos.SegmentView> segments,
        ProgressView progress) {}

    // ── 과정 ──

    public record ItemView(
        String id, String contentId, boolean required, String title,
        int durationSec, double percent, boolean done, boolean started) {}

    public record ModuleView(String id, String title, List<ItemView> items) {}

    public record EnrollmentView(
        String courseId, String title, String description, boolean mandatory,
        String dueOn, int requiredTotal, int requiredDone, int percent,
        String status, long totalDurationSec, List<ModuleView> modules) {}

    public record CourseCreate(
        String title, String description, boolean mandatory,
        List<CourseItemInput> items) {}

    public record CourseItemInput(String contentCode, boolean required, Integer minProgressPercent) {}

    public record AssignRequest(List<String> employeeNos, String dueOn) {}
}
