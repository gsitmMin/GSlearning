package com.gsitm.learning.security;

import jakarta.servlet.http.HttpServletResponse;
import java.util.List;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.MediaType;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.gsitm.learning.common.ApiResponse;
import com.gsitm.learning.common.ErrorBody;
import com.gsitm.learning.common.ErrorCode;

@Configuration
@EnableWebSecurity
public class SecurityConfig {

    private final ObjectMapper om;

    public SecurityConfig(ObjectMapper om) { this.om = om; }

    @Bean
    SecurityFilterChain filterChain(HttpSecurity http, JwtAuthFilter jwtFilter) throws Exception {
        return http
            .csrf(csrf -> csrf.disable())                       // JWT 무상태 — 세션·쿠키 미사용
            .cors(cors -> {})
            .sessionManagement(s -> s.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
            .exceptionHandling(e -> e
                // 401/403 모두 PRD 공통 포맷으로 직접 응답 — /error 재보안으로 상태코드가
                // 덮어써지는 것을 막는다
                .authenticationEntryPoint((req, res, ex) -> write(res, ErrorCode.UNAUTHORIZED))
                .accessDeniedHandler((req, res, ex) -> write(res, ErrorCode.FORBIDDEN)))
            .authorizeHttpRequests(auth -> auth
                // logout도 permitAll — 액세스 토큰 만료 후에도 refresh 폐기가 가능해야 한다
                .requestMatchers("/auth/login", "/auth/refresh", "/auth/logout").permitAll()
                .requestMatchers("/actuator/health", "/error").permitAll()
                .requestMatchers("/admin/**").hasRole("ADMIN")   // FR-A-04
                .anyRequest().authenticated())
            .addFilterBefore(jwtFilter, UsernamePasswordAuthenticationFilter.class)
            .build();
    }

    private void write(HttpServletResponse res, ErrorCode code) throws java.io.IOException {
        res.setStatus(code.status.value());
        res.setContentType(MediaType.APPLICATION_JSON_VALUE);
        res.setCharacterEncoding("UTF-8");
        om.writeValue(res.getWriter(),
            ApiResponse.fail(new ErrorBody(code.name(), code.defaultMessage, null, null)));
    }

    @Bean
    PasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder();
    }

    @Bean
    CorsConfigurationSource corsConfigurationSource(
            @Value("${app.cors.allowed-origins}") List<String> origins) {
        var cfg = new CorsConfiguration();
        cfg.setAllowedOrigins(origins);
        cfg.setAllowedMethods(List.of("GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"));
        cfg.setAllowedHeaders(List.of("Authorization", "Content-Type", "Idempotency-Key"));
        var source = new UrlBasedCorsConfigurationSource();
        source.registerCorsConfiguration("/**", cfg);
        return source;
    }
}
