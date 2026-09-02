"use client";
/** 카탈로그 — 검색·필터 (PRD §6.1, FR-C-09) */
import { useEffect, useMemo, useState } from "react";
import ContentCard, { type ContentSummary } from "@/components/ContentCard";
import CourseAccordion, { type EnrollmentView } from "@/components/CourseAccordion";
import type { VideoProgress } from "@/lib/types";
import { api } from "@/lib/api";

const DIFFS = ["전체", "입문", "초급", "중급", "고급"] as const;

export default function CatalogPage() {
  const [tab, setTab] = useState<"contents" | "courses">("contents");
  const [q, setQ] = useState("");
  const [diff, setDiff] = useState<(typeof DIFFS)[number]>("전체");
  const [contents, setContents] = useState<ContentSummary[]>([]);
  const [enrollments, setEnrollments] = useState<EnrollmentView[]>([]);
  const [progress, setProgress] = useState<Record<string, VideoProgress>>({});
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    void (async () => {
      const [c, e, p] = await Promise.all([
        api<ContentSummary[]>("/contents"),
        api<EnrollmentView[]>("/me/enrollments"),
        api<Record<string, VideoProgress>>("/me/progress"),
      ]);
      setContents(c);
      setEnrollments(e);
      setProgress(p);
      setLoaded(true);
    })();
  }, []);

  const filtered = useMemo(
    () =>
      contents.filter(
        (c) =>
          (diff === "전체" || c.difficulty === diff) &&
          (q.trim() === "" || c.title.toLowerCase().includes(q.trim().toLowerCase()))
      ),
    [contents, q, diff]
  );

  return (
    <main className="page">
      <div className="page-head"><h1>카탈로그</h1></div>
      <div className="tabs" style={{ marginTop: 0, marginBottom: 18 }}>
        <button className={tab === "contents" ? "active" : ""} onClick={() => setTab("contents")}>콘텐츠</button>
        <button className={tab === "courses" ? "active" : ""} onClick={() => setTab("courses")}>과정</button>
      </div>

      {tab === "contents" ? (
        <>
          <div className="filter-row">
            <input
              className="search-input"
              placeholder="제목으로 검색"
              value={q}
              onChange={(e) => setQ(e.target.value)}
              aria-label="콘텐츠 검색"
            />
            {DIFFS.map((d) => (
              <button key={d} className={`chip ${diff === d ? "on" : ""}`} onClick={() => setDiff(d)}>
                {d}
              </button>
            ))}
          </div>
          {!loaded ? (
            <div className="grid-cards">
              {[0, 1, 2, 3, 4, 5].map((i) => <div key={i} className="card skeleton sk-card" />)}
            </div>
          ) : filtered.length === 0 ? (
            <p className="empty">조건에 맞는 콘텐츠가 없습니다.</p>
          ) : (
            <div className="grid-cards">
              {filtered.map((c) => (
                <ContentCard key={c.id} c={c} percent={progress[c.id]?.percent} />
              ))}
            </div>
          )}
        </>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          {!loaded
            ? [0, 1].map((i) => <div key={i} className="card skeleton sk-row" />)
            : enrollments.map((e) => <CourseAccordion key={e.courseId} e={e} />)}
        </div>
      )}
    </main>
  );
}
