package com.gsitm.learning.security;

import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;
import com.gsitm.learning.common.ApiResponse;

@RestController
public class AuthController {
    private final AuthService auth;

    public AuthController(AuthService auth) { this.auth = auth; }

    @PostMapping("/auth/login")
    public ApiResponse<AuthDtos.TokenResponse> login(
            @Valid @RequestBody AuthDtos.LoginRequest req, HttpServletRequest http) {
        return ApiResponse.ok(auth.login(req.email(), req.password(), ip(http), ua(http)));
    }

    @PostMapping("/auth/refresh")
    public ApiResponse<AuthDtos.TokenResponse> refresh(@Valid @RequestBody AuthDtos.RefreshRequest req) {
        return ApiResponse.ok(auth.refresh(req.refreshToken()));
    }

    @PostMapping("/auth/logout")
    public ApiResponse<Void> logout(@Valid @RequestBody AuthDtos.RefreshRequest req) {
        auth.logout(req.refreshToken());
        return ApiResponse.ok(null);
    }

    @GetMapping("/me")
    public ApiResponse<AuthDtos.UserView> me(@AuthenticationPrincipal AuthPrincipal principal) {
        return ApiResponse.ok(auth.me(principal.accountId()));
    }

    @PostMapping("/me/password")
    public ApiResponse<Void> changePassword(
            @AuthenticationPrincipal AuthPrincipal principal,
            @Valid @RequestBody AuthDtos.ChangePasswordRequest req, HttpServletRequest http) {
        auth.changePassword(principal.accountId(), req.currentPassword(), req.newPassword(),
            ip(http), ua(http));
        return ApiResponse.ok(null);
    }

    /** 권한 체크 확인용 — ADMIN만 200, LEARNER는 403 (FR-A-04) */
    @GetMapping("/admin/ping")
    public ApiResponse<String> adminPing() {
        return ApiResponse.ok("pong");
    }

    private String ip(HttpServletRequest req) {
        String fwd = req.getHeader("X-Forwarded-For");
        return fwd != null ? fwd.split(",")[0].trim() : req.getRemoteAddr();
    }
    private String ua(HttpServletRequest req) {
        String ua = req.getHeader("User-Agent");
        return ua != null && ua.length() > 300 ? ua.substring(0, 300) : ua;
    }
}
