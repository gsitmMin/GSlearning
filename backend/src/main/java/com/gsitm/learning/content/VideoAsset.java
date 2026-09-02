package com.gsitm.learning.content;

import jakarta.persistence.*;
import java.time.Instant;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;

@Entity
@Table(name = "video_asset")
public class VideoAsset {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "content_id", nullable = false, unique = true)
    private Long contentId;

    @Column(nullable = false)
    private String provider = "VIMEO";

    @Column(name = "provider_video_id", nullable = false)
    private String providerVideoId;

    @Column(name = "embed_hash")
    private String embedHash;

    @Column(name = "thumbnail_url")
    private String thumbnailUrl;

    @Column(name = "download_enabled", nullable = false)
    private boolean downloadEnabled = false;

    @JdbcTypeCode(SqlTypes.JSON)
    @Column(name = "raw_metadata")
    private String rawMetadata;

    @Column(name = "synced_at")
    private Instant syncedAt;

    protected VideoAsset() {}

    public VideoAsset(Long contentId, String providerVideoId, String embedHash,
                      String thumbnailUrl, String rawMetadata) {
        this.contentId = contentId;
        this.providerVideoId = providerVideoId;
        this.embedHash = embedHash;
        this.thumbnailUrl = thumbnailUrl;
        this.rawMetadata = rawMetadata;
        this.syncedAt = Instant.now();
    }

    public Long getContentId() { return contentId; }
    public String getProviderVideoId() { return providerVideoId; }
    public String getEmbedHash() { return embedHash; }
    public String getThumbnailUrl() { return thumbnailUrl; }
}
