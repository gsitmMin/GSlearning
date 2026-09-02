package com.gsitm.learning.security;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.SecureRandom;
import java.time.Duration;
import java.time.Instant;
import java.util.Base64;
import java.util.HexFormat;
import java.util.List;
import java.util.Map;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import com.gsitm.learning.audit.AuditService;
import com.gsitm.learning.common.ApiException;
import com.gsitm.learning.common.ErrorCode;
import com.gsitm.learning.employee.Employee;

@Service
public class AuthService {
    private final UserAccountRepository accounts;
    private final RefreshTokenRepository refreshTokens;
    private final PasswordEncoder encoder;
    private final JwtService jwt;
    private final AuditService audit;
    private final Duration refreshTtl;
    private final SecureRandom random = new SecureRandom();

    public AuthService(UserAccountRepository accounts, RefreshTokenRepository refreshTokens,
                       PasswordEncoder encoder, JwtService jwt, AuditService audit,
                       @Value("${app.jwt.refresh-ttl}") Duration refreshTtl) {
        this.accounts = accounts;
        this.refreshTokens = refreshTokens;
        this.encoder = encoder;
        this.jwt = jwt;
        this.audit = audit;
        this.refreshTtl = refreshTtl;
    }

    @Transactional
    public AuthDtos.TokenResponse login(String email, String rawPassword, String ip, String ua) {
        var account = accounts.findByEmail(email).orElse(null);
        if (account == null || !encoder.matches(rawPassword, account.getPasswordHash())) {
            audit.record(null, null, "LOGIN_FAILED", "user_account", email, null, ip, ua);
            throw new ApiException(ErrorCode.LOGIN_FAILED);
        }
        if (!account.isEnabled() || !account.getEmployee().isActive()) {
            audit.record(account.getId(), account.getEmployee().getEmployeeNo(),
                "LOGIN_BLOCKED", "user_account", email, null, ip, ua);
            throw new ApiException(ErrorCode.ACCOUNT_DISABLED);
        }
        account.touchLogin();
        audit.record(account.getId(), account.getEmployee().getEmployeeNo(),
            "LOGIN_SUCCESS", null, null, null, ip, ua);
        return issueTokens(account);
    }

    /** Refresh 회전: 기존 토큰 폐기 후 새 쌍 발급 */
    @Transactional
    public AuthDtos.TokenResponse refresh(String refreshToken) {
        var stored = refreshTokens.findByTokenHash(sha256(refreshToken))
            .filter(RefreshToken::isUsable)
            .orElseThrow(() -> new ApiException(ErrorCode.INVALID_REFRESH_TOKEN));
        stored.revoke();
        var account = accounts.findById(stored.getUserAccountId())
            .filter(a -> a.isEnabled() && a.getEmployee().isActive())
            .orElseThrow(() -> new ApiException(ErrorCode.INVALID_REFRESH_TOKEN));
        return issueTokens(account);
    }

    @Transactional
    public void logout(String refreshToken) {
        refreshTokens.findByTokenHash(sha256(refreshToken)).ifPresent(RefreshToken::revoke);
    }

    @Transactional
    public void changePassword(Long accountId, String current, String next, String ip, String ua) {
        var account = accounts.findById(accountId)
            .orElseThrow(() -> new ApiException(ErrorCode.UNAUTHORIZED));
        if (!encoder.matches(current, account.getPasswordHash())) {
            throw new ApiException(ErrorCode.LOGIN_FAILED, "현재 비밀번호가 올바르지 않습니다.");
        }
        account.changePassword(encoder.encode(next));
        refreshTokens.revokeAllFor(accountId);   // 전 기기 재로그인
        audit.record(accountId, account.getEmployee().getEmployeeNo(),
            "PASSWORD_CHANGED", "user_account", String.valueOf(accountId), null, ip, ua);
    }

    @Transactional(readOnly = true)
    public AuthDtos.UserView me(Long accountId) {
        var account = accounts.findById(accountId)
            .orElseThrow(() -> new ApiException(ErrorCode.UNAUTHORIZED));
        return toView(account);
    }

    // ── 내부 ──────────────────────────────────────────────

    private AuthDtos.TokenResponse issueTokens(UserAccount account) {
        List<String> roles = List.copyOf(account.getRoles());
        String access = jwt.createAccessToken(
            account.getId(), account.getEmployee().getEmployeeNo(),
            account.getEmployee().getId(), roles);

        byte[] buf = new byte[48];
        random.nextBytes(buf);
        String refresh = Base64.getUrlEncoder().withoutPadding().encodeToString(buf);
        refreshTokens.save(new RefreshToken(
            account.getId(), sha256(refresh), Instant.now().plus(refreshTtl)));

        return new AuthDtos.TokenResponse(access, refresh, toView(account));
    }

    private AuthDtos.UserView toView(UserAccount account) {
        Employee e = account.getEmployee();
        return new AuthDtos.UserView(
            account.getId(), e.getEmployeeNo(), e.getName(), e.getEmail(),
            e.getOrganization().getName(), e.getPosition(),
            List.copyOf(account.getRoles()), account.isMustChangePassword());
    }

    private String sha256(String s) {
        try {
            var md = MessageDigest.getInstance("SHA-256");
            return HexFormat.of().formatHex(md.digest(s.getBytes(StandardCharsets.UTF_8)));
        } catch (Exception e) {
            throw new IllegalStateException(e);
        }
    }
}
