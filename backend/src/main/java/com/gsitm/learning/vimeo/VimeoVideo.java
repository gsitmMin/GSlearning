package com.gsitm.learning.vimeo;

/** Vimeo 영상 메타데이터 (어댑터 외부로 나가는 표현) */
public record VimeoVideo(
    String vimeoId,
    String name,
    int durationSec,
    String createdAt,
    String thumbnailUrl,
    String privacyView,
    String privacyEmbed,
    String embedHash,
    String rawJson
) {}
