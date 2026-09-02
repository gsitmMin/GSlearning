package com.gsitm.learning.vimeo;

import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.regex.Matcher;
import java.util.regex.Pattern;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;
import com.fasterxml.jackson.databind.JsonNode;

@Component
public class VimeoVideoProvider implements VideoProvider {
    private static final Logger log = LoggerFactory.getLogger(VimeoVideoProvider.class);
    private static final String VIDEO_FIELDS =
        "uri,name,duration,created_time,privacy.view,privacy.embed,pictures.base_link,player_embed_url";
    private static final Pattern HASH = Pattern.compile("[?&]h=([0-9a-f]+)");

    private final VimeoClient client;
    private final String ownerUriOverride;
    private volatile String ownerUri; // 조직 소유자 URI (지연 탐색 캐시)

    public VimeoVideoProvider(VimeoClient client,
                              @Value("${app.vimeo.owner-uri:}") String ownerUriOverride) {
        this.client = client;
        this.ownerUriOverride = ownerUriOverride;
    }

    /**
     * 영상 소유자 결정: 설정 override → /me/workspaces에서 본인이 아닌 조직 →
     * 없으면 본인 계정. (관리자 토큰은 /me/videos에 조직 영상이 없다)
     */
    private String ownerUri() {
        if (ownerUri != null) return ownerUri;
        if (!ownerUriOverride.isBlank()) return ownerUri = ownerUriOverride;
        String self = client.get("/me?fields=uri").path("uri").asText();
        String found = self;
        for (JsonNode w : client.get("/me/workspaces").path("data")) {
            String uri = w.path("uri").asText();
            if (!uri.equals(self) && w.path("can_manage").asBoolean(false)) {
                found = uri;
                break;
            }
        }
        log.info("Vimeo 라이브러리 소유자: {} (본인: {})", found, self);
        return ownerUri = found;
    }

    @Override
    public List<VimeoVideo> listVideos() {
        List<VimeoVideo> out = new ArrayList<>();
        String uri = ownerUri() + "/videos?fields=" + VIDEO_FIELDS + "&per_page=50&sort=date&direction=desc";
        while (uri != null) {
            JsonNode page = client.get(uri);
            for (JsonNode v : page.path("data")) out.add(toVideo(v));
            JsonNode next = page.path("paging").path("next");
            uri = next.isTextual() ? next.asText() + "&fields=" + VIDEO_FIELDS : null;
        }
        return out;
    }

    @Override
    public VimeoVideo getMetadata(String providerVideoId) {
        return toVideo(client.get("/videos/" + providerVideoId + "?fields=" + VIDEO_FIELDS));
    }

    @Override
    public void restrictEmbedToDomains(String providerVideoId, List<String> domains) {
        client.patch("/videos/" + providerVideoId, Map.of("privacy", Map.of("embed", "whitelist")));
        for (String d : domains) {
            client.put("/videos/" + providerVideoId + "/privacy/domains/" + d);
        }
    }

    @Override
    public void openEmbed(String providerVideoId) {
        client.patch("/videos/" + providerVideoId, Map.of("privacy", Map.of("embed", "public")));
    }

    private VimeoVideo toVideo(JsonNode v) {
        String id = v.path("uri").asText().replaceAll(".*/", "");
        String embedUrl = v.path("player_embed_url").asText("");
        Matcher m = HASH.matcher(embedUrl);
        return new VimeoVideo(
            id,
            v.path("name").asText(),
            v.path("duration").asInt(),
            v.path("created_time").asText(""),
            v.path("pictures").path("base_link").asText(null),
            v.path("privacy").path("view").asText(""),
            v.path("privacy").path("embed").asText(""),
            m.find() ? m.group(1) : null,
            v.toString()
        );
    }
}
