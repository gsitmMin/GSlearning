package com.gsitm.learning.content;

import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.stream.Collectors;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import com.gsitm.learning.audit.AuditService;
import com.gsitm.learning.common.ApiException;
import com.gsitm.learning.common.ErrorCode;
import com.gsitm.learning.vimeo.VideoProvider;
import com.gsitm.learning.vimeo.VimeoVideo;

/** 관리자 — Vimeo 가져오기·게시·챕터 관리 */
@Service
public class ContentAdminService {
    private final VideoProvider vimeo;
    private final ContentRepo contents;
    private final VideoAssetRepo assets;
    private final ContentSegmentRepo segments;
    private final ContentAccessRepo accesses;
    private final ContentQueryService query;
    private final AuditService audit;

    public ContentAdminService(VideoProvider vimeo,
                               ContentRepo contents,
                               VideoAssetRepo assets,
                               ContentSegmentRepo segments,
                               ContentAccessRepo accesses,
                               ContentQueryService query,
                               AuditService audit) {
        this.vimeo = vimeo;
        this.contents = contents;
        this.assets = assets;
        this.segments = segments;
        this.accesses = accesses;
        this.query = query;
        this.audit = audit;
    }

    /** Vimeo 계정 영상 목록 + 등록 여부 (FR-C-01) */
    @Transactional(readOnly = true)
    public List<ContentDtos.VimeoListItem> listVimeoVideos() {
        List<VimeoVideo> videos = vimeo.listVideos();
        Set<String> imported = assets
            .findAllByProviderVideoIdIn(videos.stream().map(VimeoVideo::vimeoId).toList())
            .stream().map(VideoAsset::getProviderVideoId).collect(Collectors.toSet());
        return videos.stream()
            .map(v -> new ContentDtos.VimeoListItem(
                v.vimeoId(), v.name(), v.durationSec(),
                v.createdAt().length() >= 10 ? v.createdAt().substring(0, 10) : v.createdAt(),
                v.privacyEmbed(), imported.contains(v.vimeoId())))
            .toList();
    }

    /** 선택한 영상을 DRAFT 콘텐츠로 등록 (FR-C-02). 멱등 — 이미 등록된 건 건너뜀 */
    @Transactional
    public List<ContentDtos.Summary> importVideos(List<String> vimeoIds, String actorEmployeeNo) {
        List<ContentDtos.Summary> created = new ArrayList<>();
        long seq = contents.count();
        for (String vimeoId : vimeoIds) {
            if (assets.existsByProviderVideoId(vimeoId)) continue;
            VimeoVideo v = vimeo.getMetadata(vimeoId);
            String code = "CONT-%03d".formatted(++seq);
            LearningContent c = contents.save(
                new LearningContent(code, v.name(), "", Math.max(1, v.durationSec()), null));
            assets.save(new VideoAsset(c.getId(), v.vimeoId(), v.embedHash(),
                v.thumbnailUrl(), v.rawJson()));
            accesses.save(ContentAccess.all(c.getId()));
            audit.record(null, actorEmployeeNo, "CONTENT_IMPORTED", "learning_content", code,
                Map.of("vimeoId", vimeoId, "title", v.name()), null, null);
            created.add(new ContentDtos.Summary(code, v.name(), v.durationSec(), "입문",
                "전사공개", ContentDtos.tone(code), 0, v.thumbnailUrl(), "DRAFT"));
        }
        return created;
    }

    @Transactional
    public void publish(String code, String actorEmployeeNo) {
        LearningContent c = query.requireByCode(code);
        c.publish();
        audit.record(null, actorEmployeeNo, "CONTENT_PUBLISHED", "learning_content", code, null, null, null);
    }

    /** 챕터 전체 교체 (FR-S-01/02) */
    @Transactional
    public List<ContentDtos.SegmentView> replaceSegments(
            String code, List<ContentDtos.SegmentInput> inputs, Long actorEmployeeId, String actorEmployeeNo) {
        LearningContent c = query.requireByCode(code);
        for (ContentDtos.SegmentInput in : inputs) {
            if (in.startSec() == null || in.endSec() == null || in.endSec() <= in.startSec()) {
                throw new ApiException(ErrorCode.VALIDATION,
                    "\"%s\": 종료가 시작보다 빠릅니다.".formatted(in.title()));
            }
            if (in.endSec() > c.getDurationSec()) {
                throw new ApiException(ErrorCode.VALIDATION,
                    "\"%s\": 영상 길이(%d초)를 초과합니다.".formatted(in.title(), c.getDurationSec()));
            }
        }
        segments.deleteByContentId(c.getId());
        List<ContentDtos.SegmentInput> sorted = inputs.stream()
            .sorted((a, b) -> Integer.compare(a.startSec(), b.startSec())).toList();
        int no = 0;
        for (ContentDtos.SegmentInput in : sorted) {
            String title = (in.title() == null || in.title().isBlank()) ? "챕터 " + (no + 1) : in.title();
            segments.save(new ContentSegment(c.getId(), ++no, in.startSec(), in.endSec(),
                title, in.summary(), actorEmployeeId));
        }
        audit.record(null, actorEmployeeNo, "SEGMENTS_REPLACED", "learning_content", code,
            Map.of("count", no), null, null);
        return query.segmentsOf(code);
    }
}
