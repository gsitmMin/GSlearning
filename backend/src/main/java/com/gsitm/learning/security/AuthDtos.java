package com.gsitm.learning.security;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import java.util.List;

public final class AuthDtos {
    private AuthDtos() {}

    public record LoginRequest(
        @NotBlank @Email String email,
        @NotBlank String password) {}

    public record RefreshRequest(@NotBlank String refreshToken) {}

    public record ChangePasswordRequest(
        @NotBlank String currentPassword,
        @NotBlank @Size(min = 10, max = 72) String newPassword) {}

    public record UserView(
        Long accountId, String employeeNo, String name, String email,
        String organization, String position, List<String> roles,
        boolean mustChangePassword) {}

    public record TokenResponse(
        String accessToken, String refreshToken, UserView user) {}
}
