package com.gsitm.learning.vimeo;

import java.util.Map;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestClient;
import com.fasterxml.jackson.databind.JsonNode;

/** Vimeo API v3.4 HTTP 클라이언트. 토큰은 서버 설정에서만 읽는다 (PRD §10.1). */
@Component
public class VimeoClient {
    private final RestClient rest;

    public VimeoClient(@Value("${app.vimeo.token:}") String token) {
        this.rest = RestClient.builder()
            .baseUrl("https://api.vimeo.com")
            .defaultHeader("Authorization", "bearer " + token)
            .defaultHeader("Accept", "application/vnd.vimeo.*+json;version=3.4")
            .build();
    }

    public JsonNode get(String uri) {
        return rest.get().uri(uri).retrieve().body(JsonNode.class);
    }

    public JsonNode patch(String uri, Map<String, Object> body) {
        return rest.patch().uri(uri)
            .header("Content-Type", "application/json")
            .body(body)
            .retrieve().body(JsonNode.class);
    }

    public void put(String uri) {
        rest.put().uri(uri).retrieve().toBodilessEntity();
    }
}
