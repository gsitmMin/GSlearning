"use client";
/** 과정 카드 아코디언 — PRD §6.3 */
import { useState } from "react";
import Link from "next/link";
import { fmtMin, dDay } from "@/lib/format";

export type EnrollmentView = {
  courseId: string;
  title: string;
  description: string;
  mandatory: boolean;
  dueOn: string | null;
  requiredTotal: number;
  requiredDone: number;
  percent: number;
  status: "COMPLETED" | "IN_PROGRESS" | "ENROLLED";
  totalDurationSec: number;
  modules: {
    id: string;
    title: string;
    items: {
      id: string;
      contentId: string;
      required: boolean;
      title: string;
      durationSec: number;
      percent: number;
      done: boolean;
      started: boolean;
    }[];
  }[];
};

export default function CourseAccordion({
  e,
  defaultOpen = false,
}: {
  e: EnrollmentView;
  defaultOpen?: boolean;
}) {
  const [open, setOpen] = useState(defaultOpen);
  const d = e.dueOn ? dDay(e.dueOn) : null;
  const itemCount = e.modules.reduce((s, m) => s + m.items.length, 0);
  const showModuleLabel = e.modules.length > 1;

  return (
    <div className={`card course-card ${open ? "open" : ""}`}>
      <button className="head" onClick={() => setOpen(!open)} aria-expanded={open}>
        <div className="title-row">
          {e.mandatory && <span className="badge mandatory">필수</span>}
          {e.status === "COMPLETED" && <span className="badge done">이수 완료</span>}
          <h3>{e.title}</h3>
          <span className="chev" aria-hidden>▾</span>
        </div>
        <div className="meta-row">
          <span>영상 {itemCount}개</span>
          <span className="sep" /> <span>{fmtMin(e.totalDurationSec)}</span>
          {d !== null && e.status !== "COMPLETED" && (
            <>
              <span className="sep" />
              <span style={{ color: d <= 7 ? "var(--alert)" : undefined, fontWeight: d <= 7 ? 600 : undefined }}>
                기한 {d >= 0 ? `D-${d}` : `${-d}일 초과`}
              </span>
            </>
          )}
        </div>
        <div>
          <div className={`pbar ${e.status === "COMPLETED" ? "done" : ""}`}>
            <i style={{ width: `${e.percent}%` }} />
          </div>
          <div className="pbar-label">
            {/* FR-K-09: 완료 항목 수 + 비율 병행 표기 */}
            <span className="num">{e.requiredDone}/{e.requiredTotal}강 ({e.percent}%)</span>
            <span>{e.status === "COMPLETED" ? "이수 완료" : e.status === "IN_PROGRESS" ? "진행 중" : "미시작"}</span>
          </div>
        </div>
      </button>
      {open && (
        <div className="item-list">
          {e.modules.map((m) => (
            <div key={m.id}>
              {showModuleLabel && <div className="module-label">{m.title}</div>}
              {m.items.map((it) => (
                <Link href={`/contents/${it.contentId}`} className="item-row" key={it.id}>
                  <span className={`st ${it.done ? "done" : it.started ? "progressing" : "idle"}`} aria-hidden>
                    {it.done ? "✓" : it.started ? "●" : ""}
                  </span>
                  <span className="t">
                    {it.title}
                    {!it.required && <span style={{ color: "var(--ink-3)", fontSize: 12 }}> · 선택</span>}
                  </span>
                  <span className="mono" style={{ fontSize: 12, color: "var(--ink-3)" }}>{fmtMin(it.durationSec)}</span>
                  <span className="state num">
                    {it.done ? "완료" : it.started ? `${Math.round(it.percent)}%` : "미시작"}
                  </span>
                </Link>
              ))}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
