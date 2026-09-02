"use client";
/** 홈 — 이어보기 + 필수 교육 + 진행 중 과정 (PRD §6.1)
 *  "오늘의 추천" 자리는 이어보기·필수 교육으로 채움 — 이후 추천 카드로 교체 (§12 확장 훅 8) */
import { useEffect, useState } from "react";
import Link from "next/link";
import Thumb from "@/components/Thumb";
import ContentCard, { type ContentSummary } from "@/components/ContentCard";
import CourseAccordion, { type EnrollmentView } from "@/components/CourseAccordion";
import { api, getUser } from "@/lib/api";
import { fmtClock, fmtMin, dDay } from "@/lib/format";
import { resumePosition } from "@/lib/intervals";
import type { VideoProgress } from "@/lib/types";

export default function HomePage() {
  const [contents, setContents] = useState<ContentSummary[]>([]);
  const [enrollments, setEnrollments] = useState<EnrollmentView[]>([]);
  const [progress, setProgress] = useState<Record<string, VideoProgress>>({});
  const [loaded, setLoaded] = useState(false);
  const [userName, setUserName] = useState("");

  useEffect(() => {
    setUserName(getUser()?.name ?? "");
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

  // 이어보기 대상: 완료 전 + 가장 최근 시청
  const resume = Object.values(progress)
    .filter((p) => !p.completed && p.watchedSec > 0)
    .sort((a, b) => b.updatedAt - a.updatedAt)[0];
  const resumeContent = resume ? contents.find((c) => c.id === resume.contentId) : undefined;
  const resumeAt =
    resume && resumeContent
      ? resumePosition(resume.intervals, resume.lastPositionSec, resumeContent.durationSec)
      : 0;

  const mandatory = enrollments.filter((e) => e.mandatory && e.status !== "COMPLETED");
  const inProgress = enrollments.filter((e) => !e.mandatory && e.status !== "COMPLETED");

  // 남은 학습량 = 필수 과정 미완료 항목의 남은 시청 시간 합
  const remainSec = enrollments
    .filter((e) => e.mandatory)
    .flatMap((e) => e.modules.flatMap((m) => m.items))
    .filter((i) => i.required && !i.done)
    .reduce((s, i) => s + Math.max(0, i.durationSec * (1 - i.percent / 100)), 0);

  return (
    <main className="page">
      <div className="page-head">
        <h1>
          {userName}님, 안녕하세요.
          {remainSec > 0 && (
            <span style={{ fontWeight: 400, fontSize: 15, color: "var(--ink-2)" }}>
              {" "}오늘 필수 학습 약 {fmtMin(remainSec)}이 남아 있습니다.
            </span>
          )}
        </h1>
      </div>

      {!loaded ? (
        <div className="hero">
          <div className="card skeleton sk-hero" />
          <div className="card skeleton sk-hero" />
        </div>
      ) : (
      <div className="hero">
        {/* 이어보기 */}
        {resume && resumeContent ? (
          <Link href={`/contents/${resume.contentId}`} className="card resume-card content-card">
            <Thumb tone={resumeContent.tone} resumeRatio={resume.percent} />
            <div className="body">
              <span className="eyebrow">이어보기</span>
              <h2>{resumeContent.title}</h2>
              <p className="watch-meta">
                <span className="mono">{fmtClock(resumeAt)}</span>부터 · 남은 시간 약{" "}
                {fmtMin(resumeContent.durationSec - resume.watchedSec)}
              </p>
              <div className="pbar" style={{ marginTop: "auto" }}>
                <i style={{ width: `${resume.percent}%` }} />
              </div>
              <div className="pbar-label">
                <span className="num">{resume.percent}%</span>
                <span className="btn sm primary">계속 학습</span>
              </div>
            </div>
          </Link>
        ) : (
          <div className="card resume-card"><div className="body"><span className="eyebrow">이어보기</span><p className="empty">시청 중인 영상이 없습니다.</p></div></div>
        )}

        {/* 필수 교육 */}
        <div className="card" style={{ padding: "18px 20px", display: "flex", flexDirection: "column", gap: 12 }}>
          <span className="eyebrow">필수 교육</span>
          {mandatory.length === 0 && <p className="empty">미이수 필수 교육이 없습니다 🎉</p>}
          {mandatory.map((e) => {
            const d = e.dueOn ? dDay(e.dueOn) : null;
            return (
              <div key={e.courseId} style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
                  <span className="badge mandatory">필수</span>
                  <h3>{e.title}</h3>
                  {d !== null && (
                    <span style={{ marginLeft: "auto", color: d <= 7 ? "var(--alert)" : "var(--ink-3)", fontWeight: 600, fontSize: 13 }} className="num">
                      {d >= 0 ? `D-${d}` : `${-d}일 초과`}
                    </span>
                  )}
                </div>
                <div className="pbar"><i style={{ width: `${e.percent}%` }} /></div>
                <div className="pbar-label">
                  <span className="num">{e.requiredDone}/{e.requiredTotal}강 ({e.percent}%)</span>
                  <Link className="btn sm" href="/my">과정 보기</Link>
                </div>
              </div>
            );
          })}
        </div>
      </div>
      )}

      {loaded && inProgress.length > 0 && (
        <section className="section">
          <div className="section-head">
            <h2>진행 중인 과정</h2>
            <Link href="/my" className="more">내 학습 전체 →</Link>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            {inProgress.map((e) => <CourseAccordion key={e.courseId} e={e} />)}
          </div>
        </section>
      )}

      <section className="section">
        <div className="section-head">
          <h2>최근 등록 콘텐츠</h2>
          <Link href="/catalog" className="more">카탈로그 전체 →</Link>
        </div>
        <div className="grid-cards">
          {!loaded
            ? [0, 1, 2, 3].map((i) => <div key={i} className="card skeleton sk-card" />)
            : contents.slice(0, 4).map((c) => (
                <ContentCard key={c.id} c={c} percent={progress[c.id]?.percent} />
              ))}
        </div>
      </section>
    </main>
  );
}
