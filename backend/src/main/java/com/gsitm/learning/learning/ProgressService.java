package com.gsitm.learning.learning;

import java.util.List;
import java.util.Map;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import com.gsitm.learning.content.ContentQueryService;
import com.gsitm.learning.content.LearningContent;

/** PRD §7 서버 측 — 구간 병합·검증·저장, 완료 판정 연쇄 */
@Service
public class ProgressService {
    /** PRD §13 기술결정 11 — 실플레이어 옵션 */
    public static final Map<String, Object> EMBED_OPTIONS = Map.of(
        "title", false, "byline", false, "portrait", false,
        "autopause", false, "playsinline", true, "speed", true);

    private final VideoProgressRepo progresses;
    private final ProgressIntervalRepo intervals;
    private final ContentQueryService contents;
    private final EnrollmentService enrollments;
    private final com.gsitm.learning.employee.EmployeeRepository employees;

    public ProgressService(VideoProgressRepo progresses,
                           ProgressIntervalRepo intervals,
                           ContentQueryService contents,
                           EnrollmentService enrollments,
                           com.gsitm.learning.employee.EmployeeRepository employees) {
        this.progresses = progresses;
        this.intervals = intervals;
        this.contents = contents;
        this.enrollments = enrollments;
        this.employees = employees;
    }

    @Transactional(readOnly = true)
    public LearningDtos.PlayerInfo playerInfo(String code, Long employeeId) {
        Long orgId = employees.findById(employeeId)
            .map(e -> e.getOrganization().getId()).orElse(null);
        LearningContent c = contents.requireAccessible(code, orgId, employeeId);
        var asset = contents.assetOf(c.getId());
        var p = progresses.findByEmployeeIdAndContentId(employeeId, c.getId()).orElse(null);
        List<Interval> merged = p == null ? List.of() : loadIntervals(p.getId());
        int resumeAt = (p == null || p.isCompleted())
            ? 0
            : ProgressLogic.resumePosition(merged, p.getLastPositionSec(), c.getDurationSec());
        return new LearningDtos.PlayerInfo(
            asset.getProviderVideoId(), asset.getEmbedHash(), c.getDurationSec(),
            EMBED_OPTIONS, resumeAt, contents.segmentsOf(code), toView(c.getCode(), p, merged));
    }

    /** POST /learning/contents/{code}/progress — §7.2 처리 흐름 */
    @Transactional
    public LearningDtos.ProgressResponse report(String code, Long employeeId, LearningDtos.ProgressReport req) {
        Long orgId = employees.findById(employeeId)
            .map(e -> e.getOrganization().getId()).orElse(null);
        LearningContent c = contents.requireAccessible(code, orgId, employeeId);

        VideoProgress p = progresses.findByEmployeeIdAndContentId(employeeId, c.getId())
            .orElseGet(() -> progresses.save(new VideoProgress(employeeId, c.getId())));
        List<Interval> prev = loadIntervals(p.getId());

        // ① 범위 검증
        List<Interval> incoming = (req.intervals() == null ? List.<LearningDtos.IntervalDto>of() : req.intervals())
            .stream().map(d -> new Interval(d.start(), d.end())).toList();
        var validation = ProgressLogic.validateRange(incoming, c.getDurationSec());

        // ② 병합 (멱등 — FR-L-07)
        List<Interval> next = ProgressLogic.merge(
            java.util.stream.Stream.concat(prev.stream(), validation.accepted().stream()).toList());

        // ③ 최대 증가량 검증 — 물리적으로 불가능한 보고 거부 (§7.3)
        var lastReport = p.getLastWatchedAt();
        if (lastReport != null && ProgressLogic.violatesMaxGain(
                ProgressLogic.watchedSec(prev), ProgressLogic.watchedSec(next),
                System.currentTimeMillis() - lastReport.toEpochMilli())) {
            p.touchReport();
            var rejected = new java.util.ArrayList<>(toRejected(validation.rejected()));
            validation.accepted().forEach(iv ->
                rejected.add(new LearningDtos.RejectedDto(new LearningDtos.IntervalDto(iv.start(), iv.end()), "MAX_GAIN")));
            return new LearningDtos.ProgressResponse(toView(code, p, prev), rejected);
        }

        double percent = ProgressLogic.percent(next, c.getDurationSec());
        int lastPos = (int) Math.max(0, Math.min(
            req.lastPosition() == null ? p.getLastPositionSec() : req.lastPosition(),
            c.getDurationSec()));
        p.update(ProgressLogic.watchedSec(next), percent, lastPos);

        intervals.deleteByVideoProgressId(p.getId());
        next.forEach(iv -> intervals.save(new VideoProgressInterval(p.getId(), iv.start(), iv.end())));

        // ④ 과정 이수 판정 연쇄 (FR-K-06)
        enrollments.onProgressChanged(employeeId, c.getId(), percent, p.isCompleted());

        return new LearningDtos.ProgressResponse(toView(code, p, next), toRejected(validation.rejected()));
    }

    @Transactional(readOnly = true)
    public Map<String, LearningDtos.ProgressView> myProgress(Long employeeId) {
        var out = new java.util.LinkedHashMap<String, LearningDtos.ProgressView>();
        for (VideoProgress p : progresses.findByEmployeeId(employeeId)) {
            String code = contents.codeOf(p.getContentId());
            if (code != null) out.put(code, toView(code, p, loadIntervals(p.getId())));
        }
        return out;
    }

    private List<Interval> loadIntervals(Long progressId) {
        return intervals.findByVideoProgressId(progressId).stream()
            .map(VideoProgressInterval::toInterval).toList();
    }

    private List<LearningDtos.RejectedDto> toRejected(List<ProgressLogic.Rejected> list) {
        return list.stream().map(r -> new LearningDtos.RejectedDto(
            new LearningDtos.IntervalDto(r.interval().start(), r.interval().end()), r.reason())).toList();
    }

    private LearningDtos.ProgressView toView(String code, VideoProgress p, List<Interval> merged) {
        if (p == null) {
            return new LearningDtos.ProgressView(code, List.of(), 0, 0, 0, false, 0);
        }
        return new LearningDtos.ProgressView(
            code,
            merged.stream().map(iv -> new LearningDtos.IntervalDto(iv.start(), iv.end())).toList(),
            p.getWatchedSec(),
            p.getProgressPercent().doubleValue(),
            p.getLastPositionSec(),
            p.isCompleted(),
            p.getLastWatchedAt() == null ? 0 : p.getLastWatchedAt().toEpochMilli());
    }
}
