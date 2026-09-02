package com.gsitm.learning.learning;

import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import com.gsitm.learning.content.ContentRepo;
import com.gsitm.learning.content.LearningContent;

/** 수강 현황 조회 + 이수 판정 (FR-K-06/07/09) */
@Service
public class EnrollmentService {
    private final EnrollmentRepo enrollments;
    private final CourseRepo courses;
    private final CourseModuleRepo modules;
    private final LearningItemRepo items;
    private final CompletionRepo completions;
    private final VideoProgressRepo progresses;
    private final ContentRepo contents;

    public EnrollmentService(EnrollmentRepo enrollments,
                             CourseRepo courses,
                             CourseModuleRepo modules,
                             LearningItemRepo items,
                             CompletionRepo completions,
                             VideoProgressRepo progresses,
                             ContentRepo contents) {
        this.enrollments = enrollments;
        this.courses = courses;
        this.modules = modules;
        this.items = items;
        this.completions = completions;
        this.progresses = progresses;
        this.contents = contents;
    }

    /** 진도 변경 시 항목 완료 → 과정 상태 재계산 (ProgressService에서 호출) */
    @Transactional
    public void onProgressChanged(Long employeeId, Long contentId, double percent, boolean videoCompleted) {
        for (LearningItem item : items.findByContentId(contentId)) {
            CourseModule module = modules.findById(item.getCourseModuleId()).orElse(null);
            if (module == null) continue;
            Enrollment e = enrollments
                .findByCourseIdAndEmployeeId(module.getCourseId(), employeeId).orElse(null);
            if (e == null) continue;

            e.markInProgress();
            boolean meets = percent >= item.getMinProgressPercent() || videoCompleted;
            if (meets && !completions.existsByEnrollmentIdAndLearningItemId(e.getId(), item.getId())) {
                completions.save(new LearningItemCompletion(e.getId(), item.getId()));
            }
            recalcStatus(e);
        }
    }

    private List<LearningItem> itemsOfCourse(Long courseId) {
        List<Long> moduleIds = modules.findByCourseIdOrderBySequenceNo(courseId).stream()
            .map(CourseModule::getId).toList();
        return items.findByCourseModuleIdInOrderBySequenceNo(moduleIds);
    }

    private void recalcStatus(Enrollment e) {
        List<LearningItem> required = itemsOfCourse(e.getCourseId()).stream()
            .filter(LearningItem::isRequired).toList();
        var doneIds = completions.findByEnrollmentId(e.getId()).stream()
            .map(LearningItemCompletion::getLearningItemId).collect(Collectors.toSet());
        if (!required.isEmpty() && required.stream().allMatch(i -> doneIds.contains(i.getId()))) {
            e.markCompleted();
        }
    }

    @Transactional(readOnly = true)
    public List<LearningDtos.EnrollmentView> myEnrollments(Long employeeId) {
        List<LearningDtos.EnrollmentView> out = new ArrayList<>();
        for (Enrollment e : enrollments.findByEmployeeId(employeeId)) {
            Course course = courses.findById(e.getCourseId()).orElse(null);
            if (course == null) continue;

            List<CourseModule> moduleList = modules.findByCourseIdOrderBySequenceNo(course.getId());
            List<LearningItem> allItems = items.findByCourseModuleIdInOrderBySequenceNo(
                moduleList.stream().map(CourseModule::getId).toList());
            var doneIds = completions.findByEnrollmentId(e.getId()).stream()
                .map(LearningItemCompletion::getLearningItemId).collect(Collectors.toSet());
            Map<Long, VideoProgress> progressMap = progresses.findByEmployeeId(employeeId).stream()
                .collect(Collectors.toMap(VideoProgress::getContentId, p -> p));

            List<LearningDtos.ModuleView> moduleViews = new ArrayList<>();
            long totalDuration = 0;
            int requiredTotal = 0, requiredDone = 0;
            double percentSum = 0;

            for (CourseModule m : moduleList) {
                List<LearningDtos.ItemView> itemViews = new ArrayList<>();
                for (LearningItem item : allItems) {
                    if (!item.getCourseModuleId().equals(m.getId())) continue;
                    LearningContent c = contents.findById(item.getContentId()).orElse(null);
                    if (c == null) continue;
                    VideoProgress p = progressMap.get(item.getContentId());
                    double percent = p == null ? 0 : p.getProgressPercent().doubleValue();
                    boolean done = doneIds.contains(item.getId());
                    totalDuration += c.getDurationSec();
                    if (item.isRequired()) {
                        requiredTotal++;
                        if (done) requiredDone++;
                        percentSum += Math.min(100, percent);
                    }
                    itemViews.add(new LearningDtos.ItemView(
                        String.valueOf(item.getId()), c.getCode(), item.isRequired(),
                        c.getTitle(), c.getDurationSec(), percent, done,
                        p != null && p.getWatchedSec() > 0));
                }
                moduleViews.add(new LearningDtos.ModuleView(
                    String.valueOf(m.getId()), m.getTitle(), itemViews));
            }

            int percent = requiredTotal == 0 ? 0 : (int) Math.round(percentSum / requiredTotal);
            out.add(new LearningDtos.EnrollmentView(
                course.getCode(), course.getTitle(), course.getDescription(), course.isMandatory(),
                e.getDueOn() == null ? null : e.getDueOn().toString(),
                requiredTotal, requiredDone, percent, e.getStatus(), totalDuration, moduleViews));
        }
        return out;
    }

    // ── 관리자: 과정 생성·배정 (M3 최소 구현 — E2E용) ──

    @Transactional
    public String createCourse(LearningDtos.CourseCreate req) {
        String code = "CRS-%03d".formatted(courses.count() + 1);
        Course course = courses.save(new Course(code, req.title(),
            req.description() == null ? "" : req.description(), req.mandatory()));
        CourseModule module = modules.save(new CourseModule(course.getId(), 1, "기본"));
        int no = 0;
        for (LearningDtos.CourseItemInput in : req.items()) {
            LearningContent c = contents.findByCode(in.contentCode())
                .orElseThrow(() -> new com.gsitm.learning.common.ApiException(
                    com.gsitm.learning.common.ErrorCode.RESOURCE_NOT_FOUND,
                    "콘텐츠 없음: " + in.contentCode()));
            items.save(new LearningItem(module.getId(), ++no, c.getId(), in.required(),
                in.minProgressPercent() == null ? 90 : in.minProgressPercent()));
        }
        return code;
    }

    @Transactional
    public int assign(String courseCode, List<Long> employeeIds, Long assignedBy, LocalDate dueOn) {
        Course course = courses.findByCode(courseCode)
            .orElseThrow(() -> new com.gsitm.learning.common.ApiException(
                com.gsitm.learning.common.ErrorCode.RESOURCE_NOT_FOUND, "과정을 찾을 수 없습니다."));
        int created = 0;
        for (Long empId : employeeIds) {
            if (enrollments.findByCourseIdAndEmployeeId(course.getId(), empId).isEmpty()) {
                enrollments.save(new Enrollment(course.getId(), empId, assignedBy, dueOn));
                created++;
            }
        }
        return created;
    }
}
