package com.gsitm.learning.security;

import jakarta.persistence.*;
import java.time.Instant;

/** Refresh Token — 해시로만 저장, 회전(rotate)·폐기 지원 (FR-A-02/06) */
@Entity
@Table(name = "user_refresh_token")
public class RefreshToken {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "user_account_id", nullable = false)
    private Long userAccountId;

    @Column(name = "token_hash", nullable = false, unique = true)
    private String tokenHash;

    @Column(name = "expires_at", nullable = false)
    private Instant expiresAt;

    @Column(name = "revoked_at")
    private Instant revokedAt;

    protected RefreshToken() {}

    public RefreshToken(Long userAccountId, String tokenHash, Instant expiresAt) {
        this.userAccountId = userAccountId;
        this.tokenHash = tokenHash;
        this.expiresAt = expiresAt;
    }

    public Long getUserAccountId() { return userAccountId; }
    public boolean isUsable() {
        return revokedAt == null && expiresAt.isAfter(Instant.now());
    }
    public void revoke() { this.revokedAt = Instant.now(); }
}
