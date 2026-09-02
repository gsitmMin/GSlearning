"use client";
/** 내 학습 — 과정 아코디언 (PRD §6.1/§6.3) */
import { useEffect, useState } from "react";
import CourseAccordion, { type EnrollmentView } from "@/components/CourseAccordion";
import { api } from "@/lib/api";

export default function MyLearningPage() {
  const [enrollments, setEnrollments] = useState<EnrollmentView[]>([]);
  const [loaded, setLoaded] = useState(false);
  useEffect(() => {
    void api<EnrollmentView[]>("/me/enrollments").then((d) => { setEnrollments(d); setLoaded(true); });
  }, []);

  const active = enrollments.filter((e) => e.status !== "COMPLETED");
  const done = enrollments.filter((e) => e.status === "COMPLETED");

  return (
    <main className="page">
      <div className="page-head"><h1>내 학습</h1></div>
      <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
        {!loaded && [0, 1].map((i) => <div key={i} className="card skeleton sk-row" />)}
        {loaded && active.map((e, i) => <CourseAccordion key={e.courseId} e={e} defaultOpen={i === 0} />)}
        {loaded && active.length === 0 && <p className="empty">진행 중인 과정이 없습니다.</p>}
      </div>
      {done.length > 0 && (
        <section className="section">
          <div className="section-head"><h2>이수 완료</h2></div>
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            {done.map((e) => <CourseAccordion key={e.courseId} e={e} />)}
          </div>
        </section>
      )}
    </main>
  );
}
