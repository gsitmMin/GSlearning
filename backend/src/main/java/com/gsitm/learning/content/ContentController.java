package com.gsitm.learning.content;

import java.util.List;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;
import com.gsitm.learning.common.ApiResponse;
import com.gsitm.learning.security.AuthPrincipal;

@RestController
public class ContentController {
    private final ContentQueryService query;

    public ContentController(ContentQueryService query) { this.query = query; }

    @GetMapping("/contents")
    public ApiResponse<List<ContentDtos.Summary>> list() {
        return ApiResponse.ok(query.listPublished());
    }

    @GetMapping("/contents/{code}")
    public ApiResponse<ContentDtos.Detail> detail(@PathVariable String code) {
        return ApiResponse.ok(query.detail(code));
    }

    @GetMapping("/contents/{code}/segments")
    public ApiResponse<List<ContentDtos.SegmentView>> segments(@PathVariable String code) {
        return ApiResponse.ok(query.segmentsOf(code));
    }
}

@RestController
@RequestMapping("/admin")
class ContentAdminController {
    private final ContentAdminService admin;
    private final ContentQueryService query;

    ContentAdminController(ContentAdminService admin, ContentQueryService query) {
        this.admin = admin;
        this.query = query;
    }

    @GetMapping("/vimeo/videos")
    ApiResponse<List<ContentDtos.VimeoListItem>> vimeoVideos() {
        return ApiResponse.ok(admin.listVimeoVideos());
    }

    @PostMapping("/vimeo/videos/import")
    ApiResponse<List<ContentDtos.Summary>> importVideos(
            @RequestBody ContentDtos.ImportRequest req,
            @AuthenticationPrincipal AuthPrincipal principal) {
        return ApiResponse.ok(admin.importVideos(req.vimeoIds(), principal.employeeNo()));
    }

    @GetMapping("/contents")
    ApiResponse<List<ContentDtos.Summary>> allContents() {
        return ApiResponse.ok(query.listAll());
    }

    @PostMapping("/contents/{code}/publish")
    ApiResponse<Void> publish(@PathVariable String code,
                              @AuthenticationPrincipal AuthPrincipal principal) {
        admin.publish(code, principal.employeeNo());
        return ApiResponse.ok(null);
    }

    @PutMapping("/contents/{code}/segments")
    ApiResponse<List<ContentDtos.SegmentView>> replaceSegments(
            @PathVariable String code,
            @RequestBody ContentDtos.SegmentsRequest req,
            @AuthenticationPrincipal AuthPrincipal principal) {
        return ApiResponse.ok(admin.replaceSegments(
            code, req.segments(), principal.employeeId(), principal.employeeNo()));
    }
}
