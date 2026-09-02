package com.gsitm.learning.security;

import jakarta.persistence.*;
import java.time.Instant;
import java.util.LinkedHashSet;
import java.util.Set;
import com.gsitm.learning.employee.Employee;

/**
 * 로그인 자격증명. Employee(인사정보)와 분리 —
 * HR 동기화가 employee를 덮어써도, 그룹웨어 SSO로 전환해도 이 테이블만 영향받는다.
 */
@Entity
@Table(name = "user_account")
public class UserAccount {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @OneToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "employee_id", nullable = false, unique = true)
    private Employee employee;

    @Column(name = "password_hash", nullable = false)
    private String passwordHash;

    @Column(name = "must_change_password", nullable = false)
    private boolean mustChangePassword;

    @Column(nullable = false)
    private boolean enabled = true;

    @Column(name = "last_login_at")
    private Instant lastLoginAt;

    @ElementCollection(fetch = FetchType.EAGER)
    @CollectionTable(name = "user_role", joinColumns = @JoinColumn(name = "user_account_id"))
    @Column(name = "role", nullable = false)
    private Set<String> roles = new LinkedHashSet<>();

    protected UserAccount() {}

    public Long getId() { return id; }
    public Employee getEmployee() { return employee; }
    public String getPasswordHash() { return passwordHash; }
    public boolean isMustChangePassword() { return mustChangePassword; }
    public boolean isEnabled() { return enabled; }
    public Set<String> getRoles() { return roles; }

    public void changePassword(String newHash) {
        this.passwordHash = newHash;
        this.mustChangePassword = false;
    }
    public void touchLogin() { this.lastLoginAt = Instant.now(); }
}
