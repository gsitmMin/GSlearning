# GSITM Learning — Vimeo 기반 사내 교육 사이트

| 폴더 | 내용 |
|---|---|
| `frontend/` | Next.js 16 · React 19 — 학습자/관리자 화면 |
| `backend/`  | Spring Boot 3.4 · Java 21 — API·인증·진도·Vimeo 연동 |

## 로컬 실행 (백엔드 → 프론트 순)

```bash
# 1. 백엔드  (localhost:8081, 기동 시 Flyway 자동 마이그레이션)
cd backend
cp src/main/resources/application-local.yml.example src/main/resources/application-local.yml
#   → DB 접속정보 / JWT 시크릿 / Vimeo 토큰 입력
export JAVA_HOME=<JDK 21 경로>
./gradlew bootRun

# 2. 프론트엔드  (localhost:3000 → /api/* 를 백엔드로 프록시)
cd frontend
cp .env.example .env.local          # BACKEND_ORIGIN=http://localhost:8081
npm install && npm run dev
```

`.env.local`의 `BACKEND_ORIGIN`을 비우면 프론트가 내장 목 API로 동작한다 (백엔드 없는 데모).

## 데모 계정 (시드)

```
관리자   admin@gsitm.com      / admin1234!    (첫 로그인 시 비밀번호 변경 필요)
학습자   jiwon.kim@gsitm.com  / learner1234!
```

## 문서

설계 문서(PRD 포함)는 `docs/`에 있으며 저장소에는 포함하지 않는다.
각 파트 상세는 `frontend/README.md`, `backend/README.md` 참고.
