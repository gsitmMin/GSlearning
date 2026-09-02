package com.gsitm.learning.learning;

import java.time.LocalDate;
import java.util.List;
import java.util.Map;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;
import com.gsitm.learning.audit.AuditService;
import com.gsitm.learning.common.ApiResponse;
import com.gsitm.learning.security.AuthPrincipal;

@RestController
public class LearningController {
    private final ProgressService progress;
    private final EnrollmentService enrollments;

    public LearningController(ProgressService progress, EnrollmentService enrollments) {
        this.progress = progress;
        this.enrollments = enrollments;
    }

    @GetMapping("/learning/contents/{code}/player")
    public ApiResponse<LearningDtos.PlayerInfo> player(
            @PathVariable String code, @AuthenticationPrincipal AuthPrincipal me) {
        return ApiResponse.ok(progress.playerInfo(code, me.employeeId()));
    }

    @PostMapping("/learning/contents/{code}/progress")
    public ApiResponse<LearningDtos.ProgressResponse> report(
            @PathVariable String code,
            @RequestBody LearningDtos.ProgressReport req,
            @AuthenticationPrincipal AuthPrincipal me) {
        return ApiResponse.ok(progress.report(code, me.employeeId(), req));
    }

    @GetMapping("/me/progress")
    public ApiResponse<Map<String, LearningDtos.ProgressView>> myProgress(
            @AuthenticationPrincipal AuthPrincipal me) {
        return ApiResponse.ok(progress.myProgress(me.employeeId()));
    }

    @GetMapping("/me/enrollments")
    public ApiResponse<List<LearningDtos.EnrollmentView>> myEnrollments(
            @AuthenticationPrincipal AuthPrincipal me) {
        return ApiResponse.ok(enrollments.myEnrollments(me.employeeId()));
    }
}

@RestController
@RequestMapping("/admin")
class LearningAdminController {
    private final EnrollmentService enrollments;
    private final com.gsitm.learning.employee.EmployeeRepository employees;
    private final AuditService audit;

    LearningAdminController(EnrollmentService enrollments,
                            com.gsitm.learning.employee.EmployeeRepository employees,
                            AuditService audit) {
        this.enrollments = enrollments;
        this.employees = employees;
        this.audit = audit;
    }

    @PostMapping("/courses")
    ApiResponse<String> createCourse(@RequestBody LearningDtos.CourseCreate req,
                                     @AuthenticationPrincipal AuthPrincipal me) {
        String code = enrollments.createCourse(req);
        audit.record(me.accountId(), me.employeeNo(), "COURSE_CREATED", "course", code,
            Map.of("title", req.title()), null, null);
        return ApiResponse.ok(code);
    }

    @PostMapping("/courses/{code}/assignments")
    ApiResponse<Integer> assign(@PathVariable String code,
                                @RequestBody LearningDtos.AssignRequest req,
                                @AuthenticationPrincipal AuthPrincipal me) {
        List<Long> employeeIds = employees.findAll().stream()
            .filter(e -> req.employeeNos().contains(e.getEmployeeNo()))
            .map(e -> e.getId()).toList();
        int created = enrollments.assign(code, employeeIds, me.employeeId(),
            req.dueOn() == null ? null : LocalDate.parse(req.dueOn()));
        audit.record(me.accountId(), me.employeeNo(), "COURSE_ASSIGNED", "course", code,
            Map.of("count", created), null, null);
        return ApiResponse.ok(created);
    }
}
