# GSITM Learning — 프로토타입 (frontend)

`docs/01_product/03_vimeo_lms_prd_v1.0.md` 기반. Next.js 16 + React 19 + TypeScript.

`.env.local`의 `BACKEND_ORIGIN`이 설정되면 `/api/*`가 Spring Boot(`/api/v2`)로 프록시되고
(로그인·실제 Vimeo 플레이어·서버 진도), 비우면 내장 목 API로 단독 실행됩니다.

## 실행

```bash
cd frontend
npm install
npm run dev     # → http://localhost:3000
```

## 이 프로토타입에서 진짜인 것 / 가짜인 것

| 진짜 (실제 구현에 그대로 사용) | 가짜 (교체 대상) |
|---|---|
| `components/VimeoPlayer.tsx` — 실제 Vimeo 플레이어 (getCurrentTime 폴링) | `app/api/**` — 목 API (BACKEND_ORIGIN 없을 때 폴백) |
| `lib/api.ts` — 토큰 부착·자동 refresh | `components/MockPlayer.tsx` — 목 모드용 시뮬레이터 |
| `lib/useProgressTracker.ts` — §7 수집·배치 전송 | `lib/mock-data.ts` · `lib/store.ts` — 목 모드 전용 |
| `lib/intervals.ts` — §7 로직 (backend ProgressLogic.java와 동일 규격) | 관리자 대시보드 수치 일부 |

주의: `@vimeo/player`의 timeupdate 이벤트는 환경에 따라 유실되어 **getCurrentTime 폴링(400ms)**으로
구간을 수집한다. StrictMode 이중 마운트 대응으로 플레이어는 마운트마다 새 호스트 div에 생성한다.

## 확인 포인트

1. **시청 페이지** `/contents/CONT-001` — 재생 후 타임라인을 클릭해 건너뛰어 보세요.
   건너뛴 구간은 진도에 포함되지 않습니다 (§7, Seek 방어).
2. 하단 **진도 검증 패널** — 구간 병합 결과·전송 로그 확인,
   "조작 요청 테스트" 버튼으로 서버 거부(MAX_GAIN) 재현.
3. **챕터 편집기** `/admin/segments` — 챕터를 수정·저장하면 학습자 화면에 즉시 반영.
4. **Vimeo 라이브러리** `/admin/library` — 업로드 없이 "가져오기"만 하는 운영 방식 (§13 결정 7).
5. 진도 표기는 `2/3강 (68%)` 형식 (FR-K-09).

## 주의

- 진도 데이터는 dev 서버 메모리에 저장됩니다. **서버를 재시작하면 시드 상태로 초기화**됩니다.
- 시드 시나리오: 정보보안 1편 완료 · 2편 68% 시청 중(이어보기 대상) · Spring 교육 26% 시청.

## UI 검증 이력 (2026-09-01, Playwright)

데스크톱 1440×900 / 모바일 390×844 전 페이지 캡처 + 가로 오버플로·콘솔 에러 자동 검사.
검사 결과 **오버플로 0건 · 콘솔 에러 0건**.

수정한 결함 10건:

| # | 결함 | 원인 / 수정 |
|---|---|---|
| 1 | 모바일 헤더 붕괴 (메뉴가 한 글자씩 눌림, 본문과 겹침) | `height:56px` 고정 + 축소 불가 요소 → 2행 배치, 메뉴 가로 스크롤, 조직명 숨김 |
| 2 | 이어보기 카드 썸네일이 얇은 띠로 찌그러짐 | `.content-card`의 `flex-direction:column`이 `.resume-card`를 덮음 → `row` 명시 + `min-height` |
| 3 | 모바일 시청 페이지에 챕터가 맨 아래로 밀림 | PRD §6.4 탭 구조 미구현 → 챕터 탭 추가(모바일 전용), 레일은 980px 이하 숨김 |
| 4 | 관리자/시청 페이지 모바일 가로 오버플로 | `grid-template-columns: 1fr` → `minmax(0, 1fr)` (내부 테이블이 컬럼을 밀어냄) |
| 5 | 이어보기가 `0:03` 등 무의미한 지점을 가리킴 | `resumePosition()` 추가 — 시청 구간 끝으로 스냅, 10초 미만·거의 끝은 제안 안 함 |
| 6 | 데이터 로딩 전 "없습니다" 메시지가 번쩍임 | 홈·카탈로그·내 학습·이력에 로딩 스켈레톤 추가 |
| 7 | 모바일에서 표가 압축돼 글자가 세로로 깨짐 | `.data-table { min-width: 560px }` → 컨테이너 가로 스크롤 |
| 8 | 플레이어 내부 요소 겹침, 버튼 텍스트 줄바꿈 | 절대배치 → flex 스택, `clamp()` 타임코드, `white-space: nowrap` |
| 9 | 관리자 LNB가 모바일에서 화면 절반 차지 | 가로 스크롤 탭으로 전환 |
| 10 | `favicon.ico` 404 | `app/icon.svg` 추가 |

### 실제 구현 시 보완할 점 (프로토타입에서 발견)

`MAX_GAIN` 검증(§7.3)이 **콘텐츠 단위로 "마지막 보고 시각"을 하나만** 두고 있어,
같은 영상을 두 기기/탭에서 동시에 시청하면 정상 요청이 거부됩니다.
실제 구현에서는 세션(기기) 단위로 마지막 보고 시각을 관리하거나 토큰 버킷 방식으로 바꿔야 합니다.
