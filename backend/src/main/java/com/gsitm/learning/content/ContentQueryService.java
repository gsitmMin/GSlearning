package com.gsitm.learning.content;

import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import com.gsitm.learning.common.ApiException;
import com.gsitm.learning.common.ErrorCode;

/** 학습자용 콘텐츠 조회 + 접근권한 검증 (FR-L-02) */
@Service
@Transactional(readOnly = true)
public class ContentQueryService {
    private final ContentRepo contents;
    private final VideoAssetRepo assets;
    private final ContentSegmentRepo segments;
    private final ContentAccessRepo accesses;

    public ContentQueryService(ContentRepo contents,
                               VideoAssetRepo assets,
                               ContentSegmentRepo segments,
                               ContentAccessRepo accesses) {
        this.contents = contents;
        this.assets = assets;
        this.segments = segments;
        this.accesses = accesses;
    }

    public List<ContentDtos.Summary> listPublished() {
        List<LearningContent> list = contents.findAllByOrderByIdAsc().stream()
            .filter(LearningContent::isVisibleToLearner).toList();
        Map<Long, VideoAsset> assetMap = assetMapOf(list);
        return list.stream().map(c -> toSummary(c, assetMap.get(c.getId()))).toList();
    }

    /** 관리자용 — 상태 무관 전체 */
    public List<ContentDtos.Summary> listAll() {
        List<LearningContent> list = contents.findAllByOrderByIdAsc();
        Map<Long, VideoAsset> assetMap = assetMapOf(list);
        return list.stream().map(c -> toSummary(c, assetMap.get(c.getId()))).toList();
    }

    public LearningContent requireByCode(String code) {
        return contents.findByCode(code)
            .orElseThrow(() -> new ApiException(ErrorCode.RESOURCE_NOT_FOUND, "콘텐츠를 찾을 수 없습니다."));
    }

    /** 학습자가 볼 수 있는 콘텐츠인지 검증 후 반환 */
    public LearningContent requireAccessible(String code, Long organizationId, Long employeeId) {
        LearningContent c = requireByCode(code);
        if (!c.isVisibleToLearner()) {
            throw new ApiException(ErrorCode.RESOURCE_NOT_FOUND, "콘텐츠를 찾을 수 없습니다.");
        }
        if (!accesses.canAccess(c.getId(), organizationId, employeeId)) {
            throw new ApiException(ErrorCode.FORBIDDEN, "이 콘텐츠에 대한 접근 권한이 없습니다.");
        }
        return c;
    }

    public ContentDtos.Detail detail(String code) {
        LearningContent c = requireByCode(code);
        VideoAsset a = assets.findByContentId(c.getId()).orElse(null);
        return new ContentDtos.Detail(
            c.getCode(), c.getTitle(), c.getDescription(), c.getDurationSec(),
            c.getDifficulty(), "전사공개", ContentDtos.tone(c.getCode()),
            a == null ? null : a.getThumbnailUrl(), c.getPublishStatus(), List.of());
    }

    public List<ContentDtos.SegmentView> segmentsOf(String code) {
        LearningContent c = requireByCode(code);
        return segments.findByContentIdOrderBySequenceNo(c.getId()).stream()
            .map(s -> new ContentDtos.SegmentView(
                String.valueOf(s.getId()), s.getSequenceNo(), s.getStartSec(),
                s.getEndSec(), s.getTitle(), s.getSummary()))
            .toList();
    }

    /** id → code (없으면 null) */
    public String codeOf(Long contentId) {
        return contents.findById(contentId).map(LearningContent::getCode).orElse(null);
    }

    public VideoAsset assetOf(Long contentId) {
        return assets.findByContentId(contentId)
            .orElseThrow(() -> new ApiException(ErrorCode.RESOURCE_NOT_FOUND, "영상 정보가 없습니다."));
    }

    private Map<Long, VideoAsset> assetMapOf(List<LearningContent> list) {
        List<Long> ids = list.stream().map(LearningContent::getId).toList();
        return assets.findAllByContentIdIn(ids).stream()
            .collect(Collectors.toMap(VideoAsset::getContentId, a -> a));
    }

    private ContentDtos.Summary toSummary(LearningContent c, VideoAsset a) {
        int segmentCount = segments.findByContentIdOrderBySequenceNo(c.getId()).size();
        return new ContentDtos.Summary(
            c.getCode(), c.getTitle(), c.getDurationSec(), c.getDifficulty(),
            "전사공개", ContentDtos.tone(c.getCode()), segmentCount,
            a == null ? null : a.getThumbnailUrl(), c.getPublishStatus());
    }
}
