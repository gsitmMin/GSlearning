package com.gsitm.learning.content;

import java.util.List;

public final class ContentDtos {
    private ContentDtos() {}

    /** 프론트 ContentSummary와 동일 형태 (tone은 썸네일 폴백용 색상) */
    public record Summary(
        String id, String title, int durationSec, String difficulty,
        String orgScope, int tone, int segmentCount, String thumbnailUrl,
        String publishStatus) {}

    public record Detail(
        String id, String title, String description, int durationSec,
        String difficulty, String orgScope, int tone, String thumbnailUrl,
        String publishStatus, List<Attachment> attachments) {}

    public record Attachment(String name, String size) {}

    public record SegmentView(
        String id, int sequenceNo, int startSec, int endSec, String title, String summary) {}

    public record SegmentInput(Integer startSec, Integer endSec, String title, String summary) {}

    public record SegmentsRequest(List<SegmentInput> segments) {}

    public record VimeoListItem(
        String vimeoId, String name, int durationSec, String createdAt,
        String privacyEmbed, boolean imported) {}

    public record ImportRequest(List<String> vimeoIds) {}

    public static int tone(String code) {
        return Math.floorMod(code.hashCode(), 360);
    }
}
