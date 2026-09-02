/**
 * 프로토타입 샘플 데이터.
 * 상위 문서(docs) 예시를 그대로 사용합니다 — 김지원 / Java Backend Developer /
 * Spring Boot 실전교육 / 트랜잭션 롤백 31:20~42:10 (02_scope_and_acceptance.md).
 */
import type { Content, Course } from "./types";

export const ME = {
  employeeNo: "20240117",
  name: "김지원",
  organization: "개발본부 백엔드팀",
  roles: ["LEARNER", "ADMIN"] as const,
};

const seg = (
  contentId: string,
  no: number,
  startSec: number,
  endSec: number,
  title: string,
  summary?: string
) => ({ id: `${contentId}-S${no}`, sequenceNo: no, startSec, endSec, title, summary });

export const CONTENTS: Content[] = [
  {
    id: "CONT-001",
    sourceType: "INTERNAL_VIMEO",
    title: "Spring Boot 실전교육 — 트랜잭션",
    description:
      "Java Backend 개발자 대상 사내 Spring 교육 3편. 트랜잭션의 범위·전파·롤백 정책을 실무 코드로 다룹니다. 사내 주문 서비스의 실제 장애 사례를 기반으로 롤백 설정 실수를 재현하고 수정합니다.",
    durationSec: 3600,
    difficulty: "중급",
    publishStatus: "PUBLISHED",
    availabilityStatus: "AVAILABLE",
    providerVideoId: "912345601",
    tone: 208,
    orgScope: "개발본부",
    segments: [
      seg("CONT-001", 1, 0, 270, "오리엔테이션", "과정 소개와 실습 환경 준비"),
      seg("CONT-001", 2, 270, 580, "트랜잭션 개념", "ACID와 스프링의 추상화"),
      seg("CONT-001", 3, 580, 900, "@Transactional 기초", "적용 범위와 프록시 동작"),
      seg("CONT-001", 4, 900, 1330, "전파(Propagation)", "REQUIRED와 REQUIRES_NEW"),
      seg("CONT-001", 5, 1330, 1880, "격리수준", "READ_COMMITTED 기본값의 의미"),
      seg("CONT-001", 6, 1880, 2530, "트랜잭션 롤백", "checked exception과 rollbackFor"),
      seg("CONT-001", 7, 2530, 3060, "실무 패턴", "사내 주문 서비스 장애 사례 분석"),
      seg("CONT-001", 8, 3060, 3600, "정리", "요약과 다음 편 안내"),
    ],
    attachments: [
      { name: "트랜잭션 실습 코드.zip", size: "1.2MB" },
      { name: "사내 트랜잭션 가이드 v2.pdf", size: "840KB" },
    ],
  },
  {
    id: "CONT-002",
    sourceType: "INTERNAL_VIMEO",
    title: "REST API 예외처리 표준",
    description:
      "사내 공통 오류 응답 규격(§4.2)과 예외 계층 설계. 신규 프로젝트 착수 전 필수 시청을 권장합니다.",
    durationSec: 900,
    difficulty: "초급",
    publishStatus: "PUBLISHED",
    availabilityStatus: "AVAILABLE",
    providerVideoId: "912345602",
    tone: 168,
    orgScope: "개발본부",
    segments: [
      seg("CONT-002", 1, 0, 240, "공통 응답 규격"),
      seg("CONT-002", 2, 240, 560, "예외 계층 설계"),
      seg("CONT-002", 3, 560, 900, "traceId와 로깅"),
    ],
    attachments: [{ name: "API Guide §4.2 발췌.pdf", size: "320KB" }],
  },
  {
    id: "CONT-003",
    sourceType: "INTERNAL_VIMEO",
    title: "정보보안 기본 1 — 보안의 기본 개념",
    description: "전사 필수 교육 1편. 정보자산 분류와 임직원의 기본 책임.",
    durationSec: 720,
    difficulty: "입문",
    publishStatus: "PUBLISHED",
    availabilityStatus: "AVAILABLE",
    providerVideoId: "912345603",
    tone: 8,
    orgScope: "전사공개",
    segments: [
      seg("CONT-003", 1, 0, 360, "정보자산과 분류 기준"),
      seg("CONT-003", 2, 360, 720, "임직원 기본 수칙"),
    ],
    attachments: [],
  },
  {
    id: "CONT-004",
    sourceType: "INTERNAL_VIMEO",
    title: "정보보안 기본 2 — 비밀번호와 인증 관리",
    description: "전사 필수 교육 2편. 계정·인증 수단 관리와 피싱 대응.",
    durationSec: 1080,
    difficulty: "입문",
    publishStatus: "PUBLISHED",
    availabilityStatus: "AVAILABLE",
    providerVideoId: "912345604",
    tone: 28,
    orgScope: "전사공개",
    segments: [
      seg("CONT-004", 1, 0, 420, "비밀번호 정책"),
      seg("CONT-004", 2, 420, 760, "2단계 인증"),
      seg("CONT-004", 3, 760, 1080, "피싱 메일 대응"),
    ],
    attachments: [],
  },
  {
    id: "CONT-005",
    sourceType: "INTERNAL_VIMEO",
    title: "정보보안 기본 3 — 보안사고 대응 절차",
    description: "전사 필수 교육 3편. 사고 인지 시 신고 경로와 초동 대응.",
    durationSec: 1020,
    difficulty: "입문",
    publishStatus: "PUBLISHED",
    availabilityStatus: "AVAILABLE",
    providerVideoId: "912345605",
    tone: 48,
    orgScope: "전사공개",
    segments: [
      seg("CONT-005", 1, 0, 500, "사고 유형과 신고 경로"),
      seg("CONT-005", 2, 500, 1020, "초동 대응 시나리오"),
    ],
    attachments: [],
  },
  {
    id: "CONT-006",
    sourceType: "INTERNAL_VIMEO",
    title: "Git 브랜치 전략과 코드리뷰",
    description: "사내 표준 브랜치 전략과 리뷰 문화. PR 작성 규칙 포함.",
    durationSec: 1680,
    difficulty: "초급",
    publishStatus: "PUBLISHED",
    availabilityStatus: "AVAILABLE",
    providerVideoId: "912345606",
    tone: 258,
    orgScope: "개발본부",
    segments: [
      seg("CONT-006", 1, 0, 540, "브랜치 전략"),
      seg("CONT-006", 2, 540, 1100, "PR 작성 규칙"),
      seg("CONT-006", 3, 1100, 1680, "리뷰어 가이드"),
    ],
    attachments: [{ name: "PR 템플릿.md", size: "4KB" }],
  },
  {
    id: "CONT-007",
    sourceType: "INTERNAL_VIMEO",
    title: "신규입사자 온보딩 가이드",
    description: "첫 주에 알아야 할 것들 — 계정, 근태, 협업 도구, 조직 문화.",
    durationSec: 540,
    difficulty: "입문",
    publishStatus: "PUBLISHED",
    availabilityStatus: "AVAILABLE",
    providerVideoId: "912345607",
    tone: 138,
    orgScope: "전사공개",
    segments: [seg("CONT-007", 1, 0, 540, "전체")],
    attachments: [],
  },
  {
    id: "CONT-008",
    sourceType: "INTERNAL_VIMEO",
    title: "PostgreSQL 인덱스 튜닝",
    description: "실행계획 읽기와 인덱스 설계. 사내 DB 성능 점검 사례 2건 포함.",
    durationSec: 2640,
    difficulty: "고급",
    publishStatus: "PUBLISHED",
    availabilityStatus: "AVAILABLE",
    providerVideoId: "912345608",
    tone: 288,
    orgScope: "개발본부",
    segments: [
      seg("CONT-008", 1, 0, 800, "실행계획 읽기"),
      seg("CONT-008", 2, 800, 1700, "B-Tree 인덱스 설계"),
      seg("CONT-008", 3, 1700, 2640, "사내 사례 분석"),
    ],
    attachments: [],
  },
  {
    id: "CONT-009",
    sourceType: "INTERNAL_VIMEO",
    title: "Docker 컨테이너 기초",
    description: "이미지·컨테이너·볼륨 개념과 사내 레지스트리 사용법.",
    durationSec: 1500,
    difficulty: "초급",
    publishStatus: "DRAFT",
    availabilityStatus: "AVAILABLE",
    providerVideoId: "912345609",
    tone: 190,
    orgScope: "개발본부",
    segments: [],
    attachments: [],
  },
];

export const COURSES: Course[] = [
  {
    id: "CRS-001",
    title: "정보보안 기본교육",
    description: "전 임직원 연 1회 필수 이수 과정입니다.",
    mandatory: true,
    dueOn: "2026-09-08",
    modules: [
      {
        id: "CRS-001-M1",
        title: "정보보안 기본",
        items: [
          { id: "LI-101", contentId: "CONT-003", required: true, minProgressPercent: 90 },
          { id: "LI-102", contentId: "CONT-004", required: true, minProgressPercent: 90 },
          { id: "LI-103", contentId: "CONT-005", required: true, minProgressPercent: 90 },
        ],
      },
    ],
  },
  {
    id: "CRS-002",
    title: "Java 백엔드 온보딩",
    description: "백엔드팀 신규 입사자 온보딩 과정. 기초 → 심화 순서를 권장합니다.",
    mandatory: false,
    modules: [
      {
        id: "CRS-002-M1",
        title: "공통 기초",
        items: [
          { id: "LI-201", contentId: "CONT-007", required: true, minProgressPercent: 90 },
          { id: "LI-202", contentId: "CONT-006", required: true, minProgressPercent: 90 },
        ],
      },
      {
        id: "CRS-002-M2",
        title: "백엔드 심화",
        items: [
          { id: "LI-203", contentId: "CONT-001", required: true, minProgressPercent: 90 },
          { id: "LI-204", contentId: "CONT-002", required: true, minProgressPercent: 90 },
          { id: "LI-205", contentId: "CONT-008", required: false, minProgressPercent: 90 },
        ],
      },
    ],
  },
];

/** 관리자 > Vimeo 라이브러리 목 데이터 (계정에 있는 영상) */
export const VIMEO_ACCOUNT_VIDEOS = [
  ...CONTENTS.map((c) => ({
    vimeoId: c.providerVideoId,
    name: c.title,
    durationSec: c.durationSec,
    createdAt: "2026-07-14",
    imported: true as boolean,
  })),
  { vimeoId: "912345610", name: "Kubernetes 운영 실무 (1차 녹화)", durationSec: 3120, createdAt: "2026-08-21", imported: false },
  { vimeoId: "912345611", name: "사내 코드 컨벤션 설명회", durationSec: 2280, createdAt: "2026-08-25", imported: false },
  { vimeoId: "912345612", name: "2026 하반기 전사 워크숍 하이라이트", durationSec: 480, createdAt: "2026-08-28", imported: false },
];
