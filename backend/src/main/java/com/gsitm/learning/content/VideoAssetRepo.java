package com.gsitm.learning.content;

import java.util.List;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;

public interface VideoAssetRepo extends JpaRepository<VideoAsset, Long> {
    Optional<VideoAsset> findByContentId(Long contentId);
    List<VideoAsset> findAllByContentIdIn(List<Long> contentIds);
    List<VideoAsset> findAllByProviderVideoIdIn(List<String> ids);
    boolean existsByProviderVideoId(String providerVideoId);
}
