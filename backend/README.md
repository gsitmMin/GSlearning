# learning-backend

Spring Boot 3.4 · Java 21 · Gradle(단일 프로젝트) · PostgreSQL(Flyway) · JWT.
PRD: `docs/01_product/03_vimeo_lms_prd_v1.0.md` (저장소 외부 관리)

## 실행 준비

1. **JDK** — 별도 설정 불필요. `gradle/gradle-daemon-jvm.properties`(toolchainVersion=21)로
   Gradle이 JDK 21을 자동 확보해 데몬을 띄운다. JAVA_HOME이 11이어도 빌드된다.

   > 왜 21 고정인가: Spring Boot Gradle 플러그인 3.4.x는 **Gradle 실행 JVM 17+**를 요구하고,
   > Gradle 8.14는 **JDK 26을 지원하지 않는다**. 즉 JDK 11·26 모두로는 빌드가 실패한다.
2. **로컬 설정** — 접속정보·시크릿은 git에 없다:
   ```bash
   cp src/main/resources/application-local.yml.example src/main/resources/application-local.yml
   # DB 접속정보와 JWT 시크릿(openssl rand -base64 48) 입력
   ```

## 실행

```bash
./gradlew bootRun        # 기동 시 Flyway가 마이그레이션 자동 적용
./gradlew test           # 단위 + ArchUnit(패키지 의존방향)
```

### IntelliJ

`backend` 폴더를 열면 `.idea/` 설정이 Gradle JVM·프로젝트 SDK를 `temurin-21`로 잡는다.
JDK 21이 목록에 없으면: `Settings → Build Tools → Gradle → Gradle JVM`에서
`~/.jdks/jdk-21...`(또는 Download JDK로 Temurin 21)을 선택.
실행 구성 **backend [bootRun]** 이 미리 등록되어 있다.

- 포트 **8081** (8080은 로컬 다른 서비스 사용 중) · Base Path `/api/v2`
- 헬스체크: `GET /api/v2/actuator/health`

## 구현 범위 (M0)

| 영역 | 내용 |
|---|---|
| 스키마 | Flyway V1 — 테이블 18개 (PRD §8) + updated_at 트리거 |
| 시드 | V2 — 조직 6개, admin@gsitm.com(ADMIN, `admin1234!` 첫 로그인 시 변경 강제), jiwon.kim@gsitm.com(LEARNER, `learner1234!`) |
| 인증 | 로그인/refresh 회전/로그아웃/비밀번호 변경, BCrypt, JWT(HS512) |
| 권한 | `/admin/**` → ADMIN (FR-A-04), 401/403 모두 PRD 공통 오류 포맷 |
| 감사 | LOGIN_SUCCESS/FAILED/BLOCKED, PASSWORD_CHANGED (FR-X-01) |

콘텐츠·과정·진도 API는 M1~M3에서 이 위에 얹는다 (목 API는 frontend에 있음).

## 패키지 구조 = 모듈 경계

```
common/    응답 포맷·예외 (도메인을 모름)
employee/  직원·조직 (다른 도메인을 모름)
security/  인증 — 도메인 코드는 AuthPrincipal만 참조 (그룹웨어 SSO 전환 대비)
audit/     감사 로그 (도메인을 모름)
```

의존 방향은 `ArchitectureTest`(ArchUnit)가 강제한다. 위반 시 빌드 실패.
주의: 베이스 패키지에 `learning`이 포함되므로 ArchUnit에서 `..learning..` 축약 패턴 금지 (전부와 매칭됨).

## 운영 메모

- DB는 Render PostgreSQL 18 (싱가포르). `sslmode=require` 필수, Hikari 풀 5 (max_connections 100 공유).
- 기존 `public.test` 테이블이 있어 `baseline-on-migrate: true, baseline-version: 0` 설정.
- 그룹웨어 SSO 전환 시: security 패키지에 OIDC 추가, user_account.password_hash만 미사용화.

## Render 배포

Render는 Java 네이티브 런타임이 없어 **Docker 방식**으로 배포한다 (`backend/Dockerfile`).

```
New → Web Service → GitHub 저장소 연결
  Root Directory   backend        ← 이걸로 하위 폴더 인식
  Runtime          Docker         (Dockerfile 자동 감지)
  Health Check     /api/v2/actuator/health
```

환경변수 (Settings → Environment):

```
SPRING_PROFILES_ACTIVE      prod
SPRING_DATASOURCE_URL       jdbc:postgresql://<Internal-Host>/<db>   ← 같은 리전이면 Internal URL 사용 (지연 ~1ms)
SPRING_DATASOURCE_USERNAME  <user>
SPRING_DATASOURCE_PASSWORD  <password>
APP_JWT_SECRET              openssl rand -base64 48 결과
APP_VIMEO_TOKEN             Vimeo 액세스 토큰
APP_CORS_ALLOWED_ORIGINS    (선택) 프론트 도메인 — Vercel 프록시 경유면 불필요
```

- `application-prod.yml`은 전부 환경변수 참조라 시크릿 없이 커밋 안전
- 무료 플랜은 유휴 시 슬립 → 첫 요청에 JVM 콜드스타트 수십 초
- 검증됨: prod 프로필 + 환경변수만으로 부팅·로그인·Vimeo 연동 동작 (2026-09-02)
