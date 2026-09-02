package com.gsitm.learning.security;

import java.time.Duration;
import java.util.List;
import org.junit.jupiter.api.Test;
import static org.assertj.core.api.Assertions.*;

class JwtServiceTest {
    private final JwtService jwt = new JwtService(
        "test-secret-test-secret-test-secret-test-secret-1234", Duration.ofMinutes(30));

    @Test
    void 발급한_토큰을_파싱하면_클레임이_일치한다() {
        String token = jwt.createAccessToken(7L, "20240117", List.of("LEARNER", "ADMIN"));
        var claims = jwt.parse(token).orElseThrow();
        assertThat(claims.getSubject()).isEqualTo("7");
        assertThat(claims.get("empNo", String.class)).isEqualTo("20240117");
        assertThat(claims.get("roles", List.class)).containsExactly("LEARNER", "ADMIN");
    }

    @Test
    void 페이로드를_변조하면_서명_검증에_실패한다() {
        String token = jwt.createAccessToken(7L, "20240117", List.of("LEARNER"));
        // 페이로드(2번째 부분) 중간 글자를 뒤집는다 — roles를 ADMIN으로 바꾸는 위조 시도에 해당
        int payloadStart = token.indexOf('.') + 1;
        int i = payloadStart + 10;
        char[] c = token.toCharArray();
        c[i] = c[i] == 'A' ? 'B' : 'A';
        assertThat(jwt.parse(new String(c))).isEmpty();
    }

    @Test
    void 다른_키로_서명한_토큰과_쓰레기_문자열은_거부된다() {
        JwtService other = new JwtService(
            "other-secret-other-secret-other-secret-other-9999", Duration.ofMinutes(30));
        String foreign = other.createAccessToken(7L, "20240117", List.of("ADMIN"));
        assertThat(jwt.parse(foreign)).isEmpty();
        assertThat(jwt.parse("garbage")).isEmpty();
        assertThat(jwt.parse("")).isEmpty();
    }
}
