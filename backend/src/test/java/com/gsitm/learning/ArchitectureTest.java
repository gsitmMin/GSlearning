package com.gsitm.learning;

import com.tngtech.archunit.base.DescribedPredicate;
import com.tngtech.archunit.core.domain.JavaClass;
import com.tngtech.archunit.junit.AnalyzeClasses;
import com.tngtech.archunit.junit.ArchTest;
import com.tngtech.archunit.lang.ArchRule;
import static com.tngtech.archunit.core.domain.JavaClass.Predicates.resideInAPackage;
import static com.tngtech.archunit.core.domain.JavaClass.Predicates.simpleName;
import static com.tngtech.archunit.lang.syntax.ArchRuleDefinition.noClasses;

/**
 * 모듈 의존 방향 강제 — 02_architecture/02 Dependency Direction.
 * 단일 Gradle 프로젝트에서 패키지 경계를 컴파일 대신 테스트로 지킨다 (PRD §12 확장훅 7).
 *
 * 주의: 베이스 패키지에 'learning'이 포함되므로 '..learning..' 같은 축약 패턴을 쓰면
 * 전체 클래스와 매칭된다. 반드시 전체 경로 접두사를 쓴다.
 */
@AnalyzeClasses(packages = "com.gsitm.learning")
public class ArchitectureTest {

    private static final String EMPLOYEE = "com.gsitm.learning.employee..";
    private static final String SECURITY = "com.gsitm.learning.security..";
    private static final String CONTENT  = "com.gsitm.learning.content..";
    private static final String LEARNING = "com.gsitm.learning.learning..";
    private static final String VIMEO    = "com.gsitm.learning.vimeo..";
    private static final String COMMON   = "com.gsitm.learning.common..";
    private static final String AUDIT    = "com.gsitm.learning.audit..";

    @ArchTest
    static final ArchRule employee_는_다른_도메인을_모른다 = noClasses()
        .that().resideInAPackage(EMPLOYEE)
        .should().dependOnClassesThat()
        .resideInAnyPackage(SECURITY, CONTENT, LEARNING, VIMEO);

    @ArchTest
    static final ArchRule common_은_아무_도메인도_모른다 = noClasses()
        .that().resideInAPackage(COMMON)
        .should().dependOnClassesThat()
        .resideInAnyPackage(EMPLOYEE, SECURITY, CONTENT, LEARNING, VIMEO, AUDIT);

    @ArchTest
    static final ArchRule audit_은_도메인을_모른다 = noClasses()
        .that().resideInAPackage(AUDIT)
        .should().dependOnClassesThat()
        .resideInAnyPackage(EMPLOYEE, SECURITY, CONTENT, LEARNING, VIMEO);

    /** 도메인 코드는 인증 내부가 아닌 AuthPrincipal(SecurityContext 값)만 참조 — SSO 전환 대비 */
    @ArchTest
    static final ArchRule 도메인은_security_내부구현을_모른다 = noClasses()
        .that().resideInAnyPackage(EMPLOYEE, CONTENT, LEARNING, VIMEO)
        .should().dependOnClassesThat(
            resideInAPackage(SECURITY)
                .and(DescribedPredicate.not(simpleName("AuthPrincipal")))
                .as("security 내부 구현 (AuthPrincipal 제외)"));
}
