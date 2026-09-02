package com.gsitm.learning.vimeo;

import java.util.List;

/**
 * 영상 제공자 추상화 — 02_architecture/01 §4 Provider Abstraction.
 * 도메인 코드는 이 인터페이스만 사용한다. Vimeo가 교체돼도 여기까지만 영향.
 */
public interface VideoProvider {

    /** 조직 라이브러리의 영상 목록 */
    List<VimeoVideo> listVideos();

    VimeoVideo getMetadata(String providerVideoId);

    /** embed를 지정 도메인으로 제한 (PRD §10.1) */
    void restrictEmbedToDomains(String providerVideoId, List<String> domains);

    /** embed 전체 공개로 되돌림 (테스트·원복용) */
    void openEmbed(String providerVideoId);

    /** 업로드는 이번 범위 미구현 — Vimeo 웹에서 진행 (PRD §13-7) */
    default String createUploadSession() {
        throw new UnsupportedOperationException("업로드는 Vimeo 웹에서 진행합니다 (PRD §13-7)");
    }

    default void deleteVideo(String providerVideoId) {
        throw new UnsupportedOperationException("삭제는 지원하지 않습니다 (delete 스코프 미보유)");
    }
}
