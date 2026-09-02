"use client";
/** 이번 프로토타입 범위 밖 화면 — PRD 근거와 함께 표시 */
import { useParams } from "next/navigation";

const PLANNED: Record<string, { title: string; desc: string; refs: string }> = {
  contents: { title: "콘텐츠 관리", desc: "메타데이터 수정 · 게시 상태 · 접근범위 설정", refs: "FR-C-05 ~ FR-C-08 · 마일스톤 M1/M5" },
  courses: { title: "과정 구성", desc: "과정 → 모듈 → 학습 항목 편집, 이수 기준 설정", refs: "FR-K-01/02 · 마일스톤 M3" },
  assignments: { title: "배정", desc: "개인·부서 단위 과정 배정, 이수 기한 지정", refs: "FR-K-03/04 · 마일스톤 M3" },
  employees: { title: "직원", desc: "개별 등록 · CSV 일괄 업로드 (사번 기준 upsert)", refs: "FR-E-01 ~ FR-E-03 · 마일스톤 M0/M5" },
  audit: { title: "감사 로그", desc: "로그인 · 게시 · 배정 · 권한 변경 이력 조회", refs: "FR-X-01 · 마일스톤 M5" },
};

export default function PlannedPage() {
  const { menu } = useParams<{ menu: string }>();
  const p = PLANNED[menu] ?? { title: "화면", desc: "", refs: "" };
  return (
    <>
      <div className="page-head"><h1>{p.title}</h1></div>
      <div className="card empty" style={{ padding: "60px 24px" }}>
        <p style={{ fontSize: 15, fontWeight: 600, color: "var(--ink-2)" }}>이 화면은 프로토타입 범위 밖입니다</p>
        <p style={{ marginTop: 8 }}>{p.desc}</p>
        <p style={{ marginTop: 14, fontSize: 12 }} className="mono">{p.refs}</p>
      </div>
    </>
  );
}
