"use client";
/** 관리자 대시보드 — FR-D-01/02 (수치는 목 데이터) */
import { useEffect, useState } from "react";
import type { EnrollmentView } from "@/components/CourseAccordion";
import { api } from "@/lib/api";

// PoC 규모(20~30명)를 가정한 목 현황
const COURSE_STATS = [
  { name: "정보보안 기본교육", done: 15, total: 24 },
  { name: "Java 백엔드 온보딩", done: 6, total: 11 },
];
const NOT_STARTED = ["박민서 (인프라팀)", "이도현 (백엔드팀)", "정수아 (프론트엔드팀)", "최준영 (QA팀)"];

export default function AdminDashboard() {
  const [enrollments, setEnrollments] = useState<EnrollmentView[]>([]);
  useEffect(() => {
    void api<EnrollmentView[]>("/me/enrollments").then(setEnrollments);
  }, []);

  const mandatoryRate = Math.round((COURSE_STATS[0].done / COURSE_STATS[0].total) * 100);

  return (
    <>
      <div className="page-head">
        <h1>대시보드</h1>
        <span style={{ fontSize: 12.5, color: "var(--ink-3)" }}>수치는 프로토타입 목 데이터입니다</span>
      </div>
      <div className="stat-grid">
        <div className="card stat"><span className="label">활성 학습자</span><span className="value num">24</span><span className="sub">최근 7일 접속</span></div>
        <div className="card stat"><span className="label">필수 과정 이수율</span><span className="value num">{mandatoryRate}%</span><span className="sub">정보보안 기본교육 · 기한 9/8</span></div>
        <div className="card stat"><span className="label">진행 중 수강</span><span className="value num">17</span><span className="sub">과정 2개 기준</span></div>
        <div className="card stat"><span className="label">게시 콘텐츠</span><span className="value num">8</span><span className="sub">작성 중 1</span></div>
      </div>

      <section className="section">
        <div className="section-head"><h2>과정별 이수 현황</h2></div>
        <div className="card" style={{ padding: "10px 18px" }}>
          {COURSE_STATS.map((c) => (
            <div className="hbar-row" key={c.name}>
              <span>{c.name}</span>
              <div className="hbar" role="img" aria-label={`${c.name} 이수 ${c.done}명 / ${c.total}명`}>
                <i style={{ width: `${(c.done / c.total) * 100}%` }} />
              </div>
              <span className="val num">{c.done}/{c.total}명</span>
            </div>
          ))}
        </div>
      </section>

      <section className="section">
        <div className="section-head"><h2>필수 교육 미시작자</h2></div>
        <div className="card" style={{ overflowX: "auto" }}>
          <table className="data-table">
            <thead><tr><th>직원</th><th>과정</th><th>기한</th><th></th></tr></thead>
            <tbody>
              {NOT_STARTED.map((n) => (
                <tr key={n}>
                  <td>{n}</td>
                  <td>정보보안 기본교육</td>
                  <td style={{ color: "var(--alert)", fontWeight: 600 }} className="num">D-7</td>
                  <td><button className="btn sm" title="프로토타입에서는 동작하지 않습니다">알림 (예정)</button></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className="section">
        <div className="section-head"><h2>내 계정 기준 실시간 진도 (목 API 연동 확인용)</h2></div>
        <div className="card" style={{ padding: "10px 18px" }}>
          {enrollments.map((e) => (
            <div className="hbar-row" key={e.courseId}>
              <span>{e.title}</span>
              <div className="hbar"><i style={{ width: `${e.percent}%`, background: e.status === "COMPLETED" ? "var(--done)" : undefined }} /></div>
              <span className="val num">{e.requiredDone}/{e.requiredTotal}강 ({e.percent}%)</span>
            </div>
          ))}
        </div>
      </section>
    </>
  );
}
