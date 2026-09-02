package com.gsitm.learning.security;

/** SecurityContext에 올라가는 최소 정보 — 도메인 코드는 이것만 참조 (SSO 전환 대비) */
public record AuthPrincipal(Long accountId, String employeeNo) {}
