# GSITM Learning — Vimeo 기반 사내 교육 플랫폼

사내 교육 영상을 Vimeo에 두고, **누가 무엇을 어디까지 실제로 시청했는지**를 정확히 추적해
과정(Course) 이수를 판정하는 학습 관리 시스템(LMS)입니다.

> 장기 로드맵(역량 관리 · 학습 추천 · AI 코치)의 1단계로, 영상 · 진도 · 과정 · 수강 관리까지를
> 범위로 합니다. 상세 설계 문서(PRD)는 사내 `docs/`로 별도 관리하며 저장소에는 포함하지 않습니다.

---

## 기술 스택

| 영역 | 기술 | 비고 |
|---|---|---|
| Frontend | **Next.js 16** · React 19 · TypeScript | App Router, rewrites 프록시(BFF) |
| Backend | **Spring Boot 3.4** · Java 21 · Gradle | 단일 프로젝트 Modular Monolith |
| DB | **PostgreSQL 18** (Render) | 스키마는 **Flyway** 마이그레이션으로 관리 |
| 영상 | **Vimeo** (API v3.4 + Player SDK) | 업로드는 Vimeo 웹에서, 시스템은 가져오기만 |
| 인증 | Spring Security · **JWT** (jjwt) | Access 30분 + Refresh 14일 회전 |
| 배포 | **Vercel**(프론트) · **Render**(백엔드, Docker) | 백엔드는 Java 미지원 플랫폼이라 Docker 배포 |
| 테스트 | JUnit 5 · **ArchUnit**(패키지 의존방향 강제) · Playwright(E2E) | |

## 시스템 구성

```text
브라우저
   │  (같은 출처 /api/* — CORS 없음)
   ▼
Vercel · Next.js ──────────────────────────┐
   │  rewrites: /api/* → ${BACKEND_ORIGIN}/api/v2/*   │ 화면 렌더링
   ▼                                        │ Vimeo Player SDK (시청 구간 수집)
Render · Spring Boot (/api/v2)              │
   ├── PostgreSQL (Render)   진도·과정·계정·감사
   └── Vimeo API             영상 목록·메타데이터·프라이버시
```

- 브라우저는 Next.js 서버만 바라보고, 백엔드 주소는 서버 측 rewrites에만 존재 (`NEXT_PUBLIC_` 미사용)
- **Vimeo API 토큰·DB 자격증명은 백엔드 환경변수에만 존재** — 브라우저·저장소에 노출되지 않음
- 영상 스트림은 백엔드를 거치지 않고 Vimeo가 직접 서빙 (임베드)

## 주요 기능

### 학습자
- 홈: 이어보기(마지막 시청 구간 끝으로 스냅) · 필수 교육 D-day · 진행 중 과정
- 카탈로그: 검색 · 난이도 필터
- **시청 페이지**: Vimeo 플레이어 + 챕터 패널(재생 위치 연동·클릭 이동) + 누적 시청 구간 시각화
- 내 학습: 과정 아코디언 — `2/3강 (68%)` 형식의 진도, 항목별 완료 상태
- 학습 이력

### 관리자 (ADMIN 역할)
- **Vimeo 라이브러리**: 조직 계정 영상 목록 → 선택 가져오기(DRAFT) → 게시
- 콘텐츠 메타데이터(제목·설명·난이도) 수정 — Vimeo 원본과 독립
- **챕터 편집기**: 구간·제목 입력(검증 포함), 저장 즉시 학습자 화면 반영
- 과정 생성 · 구성원 배정(이수 기한 지정)
- 대시보드 · 감사 로그(로그인/게시/배정/변경 기록)

---

## 핵심 설계

### 1. 진도 추적 — 이 시스템의 심장

"마지막 재생 위치"가 아니라 **실제로 시청한 구간의 합집합**으로 진도를 계산합니다.
따라서 끝으로 건너뛰어도(Seek) 진도가 올라가지 않습니다.

```text
[클라이언트]  Vimeo Player getCurrentTime 폴링(400ms)
              → 연속 재생 구간 [start, end] 수집
              → 10초 주기 / 일시정지 / 페이지 이탈 시 배치 전송
[서버]        ① 범위 검증 (0 ≤ start < end ≤ 영상길이)
              ② 기존 구간과 합집합 병합  ← 같은 요청을 재전송해도 결과 동일(멱등)
              ③ 최대 증가량 검증: 신규 시청량 ≤ 경과 실시간 × 최대배속 2 × 1.5
                 → 조작된 요청("1초 만에 전체 시청") 거부
              ④ 진도율 = 병합 구간 합 ÷ 영상 길이,  90% 이상 → 완료 (되돌림 없음)
              ⑤ 항목 완료 → 과정의 필수 항목 전부 완료 시 수강 상태 COMPLETED
```

- 병합·검증 로직은 순수 함수로 격리: 백엔드 `learning/ProgressLogic.java` ↔ 프론트 `lib/intervals.ts` (동일 규격)
- 반복 시청은 중복 집계되지 않음, 2배속 시청은 구간 기준이므로 정상 100% 가능
- 시청 페이지의 "진도 검증 패널"에서 구간 병합·전송·거부를 실시간 확인 가능

### 2. 인증 — 그룹웨어 SSO 전환 대비

```text
employee      인사 정보 (사번이 외부 자연키 — 향후 HR 연동 매칭용)
user_account  자격증명 (BCrypt) — employee와 분리
user_role     LEARNER / ADMIN (복수 보유 가능)
```

- 로그인 → Access(30분) + Refresh(14일). Refresh는 **SHA-256 해시로만 저장**, 사용 시 회전(재사용 거부), 로그아웃 시 폐기
- 도메인 코드는 인증 구현이 아닌 `AuthPrincipal`(계정ID·사번·직원ID)만 참조 → 추후 SSO(OIDC)로 교체 시 security 패키지만 변경
- `/admin/**`은 ADMIN 전용. 401/403 모두 공통 오류 포맷의 JSON으로 응답

### 3. Vimeo 연동 — 어댑터 패턴

```java
interface VideoProvider {           // vimeo 패키지 — 도메인은 이 인터페이스만 사용
    List<VimeoVideo> listVideos();               // 조직 라이브러리 조회
    VimeoVideo getMetadata(String videoId);
    void restrictEmbedToDomains(...);            // 도메인 제한 embed
    default String createUploadSession()          // 업로드 미구현 — Vimeo 웹 사용
}
```

- 콘텐츠의 Primary Key는 자체 코드(`CONT-001`)이며 Vimeo ID는 별도 컬럼 — 향후 다른 영상 소스 추가 대비
- 관리자 계정 토큰은 `/me/videos`에 조직 영상이 없으므로 **`/me/workspaces`로 조직 소유자를 자동 탐색** 후 그 계정의 영상을 조회
- 보안: 도메인 제한 embed(whitelist)로 허용 도메인 외 재생 차단 — 유료 플랜에서 동작 검증 완료

### 4. 패키지 경계 — Modular Monolith

```text
common/    응답 포맷·예외          (도메인을 모름)
employee/  직원·조직              (다른 도메인을 모름)
security/  인증·계정              (도메인은 AuthPrincipal만 참조)
audit/     감사 기록              (도메인을 모름)
content/   콘텐츠·챕터·접근범위    → vimeo 사용
learning/  진도·과정·수강         → content 참조
vimeo/     Vimeo API 클라이언트   (도메인을 모름)
```

의존 방향은 **ArchUnit 테스트가 강제** — 위반하면 빌드가 실패합니다.
(주의: 베이스 패키지에 `learning`이 포함되므로 ArchUnit에서 `..learning..` 축약 패턴 금지)

### 5. 데이터 모델 (Flyway `V1__init.sql`, 18개 테이블)

```text
조직/계정   organization · employee · user_account · user_role · user_refresh_token
콘텐츠      learning_content · video_asset · content_segment · transcript · content_access
과정/수강   course · course_module · learning_item · enrollment · learning_item_completion
진도        video_progress · video_progress_interval   ← 시청 구간이 별도 테이블
감사        audit_log
```

- 상태값은 `varchar + CHECK` (PG enum 대신 — 마이그레이션 유연성)
- 전 테이블 `updated_at` 트리거 자동 갱신
- 접근범위(ACL): `ALL`(전사) / `ORGANIZATION`(부서) / `EXPLICIT`(개인)

### 6. API 개요 (Base `/api/v2`, 공통 포맷 `{success, data, error}`)

```http
POST /auth/login · /auth/refresh · /auth/logout        GET /me · POST /me/password
GET  /contents · /contents/{code} · /contents/{code}/segments
GET  /learning/contents/{code}/player                  ← ACL 검증 후 임베드 정보
POST /learning/contents/{code}/progress                ← 시청 구간 보고 (§진도 추적)
GET  /me/progress · /me/enrollments

# 관리자 (ADMIN)
GET  /admin/vimeo/videos      POST /admin/vimeo/videos/import
GET  /admin/contents          PATCH /admin/contents/{code}      POST .../publish
PUT  /admin/contents/{code}/segments
POST /admin/courses           POST /admin/courses/{code}/assignments
```

---

## 저장소 구조

```text
frontend/                     Next.js — 상세는 frontend/README.md
├─ app/                       화면 + (목 API — BACKEND_ORIGIN 없을 때 폴백)
├─ components/                VimeoPlayer · 챕터 · 과정 아코디언 등
└─ lib/                       api 클라이언트 · 진도 수집 훅 · intervals(§진도 로직)

backend/                      Spring Boot — 상세는 backend/README.md
├─ src/main/java/com/gsitm/learning/{common,employee,security,audit,content,learning,vimeo}
├─ src/main/resources/db/migration/    V1__init.sql · V2__seed.sql
└─ Dockerfile                 Render 배포용 (멀티스테이지)
```

## 로컬 실행 (백엔드 → 프론트 순)

```bash
# 1. 백엔드  (localhost:8081, 기동 시 Flyway 자동 마이그레이션)
cd backend
cp src/main/resources/application-local.yml.example src/main/resources/application-local.yml
#   → DB 접속정보 / JWT 시크릿(openssl rand -base64 48) / Vimeo 토큰 입력
./gradlew bootRun             # JDK는 Gradle이 21을 자동 확보 (daemon-jvm.properties)

# 2. 프론트엔드  (localhost:3000 → /api/* 를 백엔드로 프록시)
cd frontend
cp .env.example .env.local    # BACKEND_ORIGIN=http://localhost:8081
npm install && npm run dev
```

`.env.local`의 `BACKEND_ORIGIN`을 비우면 프론트가 내장 목 API로 동작한다 (백엔드 없는 데모).

## 배포

### Render (백엔드) — Java 미지원이라 Docker

```
New → Web Service → 이 저장소 연결
  Root Directory   backend      Runtime  Docker
  Health Check     /api/v2/actuator/health
환경변수: SPRING_PROFILES_ACTIVE=prod, SPRING_DATASOURCE_URL/USERNAME/PASSWORD,
         APP_JWT_SECRET(43자+), APP_VIMEO_TOKEN
```

- `application-prod.yml`은 전부 환경변수 참조 — 시크릿 없이 커밋 안전
- 무료 플랜은 유휴 시 슬립 → 첫 요청에 JVM 콜드스타트 30~60초

### Vercel (프론트)

```
New Project → 이 저장소 연결
  Root Directory   frontend     Framework  Next.js (자동)
환경변수: BACKEND_ORIGIN = https://<render-서비스>.onrender.com
```

`NEXT_PUBLIC_` 접두사를 붙이지 않는다 — 서버 측 rewrites 전용이라 브라우저에
백엔드 주소가 노출되지 않고 CORS도 발생하지 않는다.

## 데모 계정 (시드)

```
관리자   admin@gsitm.com      / admin1234!     ← 실사용 전 반드시 변경
학습자   jiwon.kim@gsitm.com  / learner1234!
```

## 로드맵

```text
완료      영상 가져오기·게시 · 챕터 · 시청/진도(Seek 방어) · 과정·배정·이수 판정
          인증(JWT)·권한·감사 · 실배포(Vercel + Render)
다음      관리자 화면 잔여(과정 구성 UI · 직원 CSV 등록 · 감사 로그 조회)
          비밀번호 변경 화면 · 진도 검증의 기기별 관리(다중 탭 오탐 개선)
이후 단계  그룹웨어 SSO · HR 연동(사번 매칭) · 퀴즈/평가 · 역량 관리 · 학습 추천 · AI 코치
```
