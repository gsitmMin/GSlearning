package com.gsitm.learning.security;

import io.jsonwebtoken.Claims;
import io.jsonwebtoken.JwtException;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.security.Keys;
import java.nio.charset.StandardCharsets;
import java.time.Duration;
import java.time.Instant;
import java.util.Date;
import java.util.List;
import java.util.Optional;
import javax.crypto.SecretKey;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

@Component
public class JwtService {
    private final SecretKey key;
    private final Duration accessTtl;

    public JwtService(
            @Value("${app.jwt.secret}") String secret,
            @Value("${app.jwt.access-ttl}") Duration accessTtl) {
        if (secret == null || secret.length() < 43) { // base64 기준 256bit 이상
            throw new IllegalStateException("app.jwt.secret은 43자 이상이어야 합니다 (openssl rand -base64 48)");
        }
        this.key = Keys.hmacShaKeyFor(secret.getBytes(StandardCharsets.UTF_8));
        this.accessTtl = accessTtl;
    }

    public String createAccessToken(Long accountId, String employeeNo, Long employeeId, List<String> roles) {
        Instant now = Instant.now();
        return Jwts.builder()
            .subject(String.valueOf(accountId))
            .claim("empNo", employeeNo)
            .claim("empId", employeeId)
            .claim("roles", roles)
            .issuedAt(Date.from(now))
            .expiration(Date.from(now.plus(accessTtl)))
            .signWith(key)
            .compact();
    }

    /** 유효하면 Claims, 아니면 empty — 필터에서 예외 대신 익명 처리 */
    public Optional<Claims> parse(String token) {
        try {
            return Optional.of(
                Jwts.parser().verifyWith(key).build().parseSignedClaims(token).getPayload());
        } catch (JwtException | IllegalArgumentException e) {
            return Optional.empty();
        }
    }
}
