"use client";
/** 챕터 목록 — 데스크톱 우측 레일과 모바일 탭에서 공용 (PRD §6.4) */
import { fmtClock } from "@/lib/format";
import type { Segment } from "@/lib/types";

export default function ChapterList({
  segments,
  currentIdx,
  isWatched,
  onJump,
}: {
  segments: Segment[];
  currentIdx: number;
  isWatched: (s: Segment) => boolean;
  onJump: (startSec: number) => void;
}) {
  if (segments.length === 0) {
    return <p className="empty">등록된 챕터가 없습니다.</p>;
  }
  return (
    <>
      {segments.map((s, i) => (
        <button
          key={s.id}
          className={`chapter-item ${i === currentIdx ? "current" : ""}`}
          onClick={() => onJump(s.startSec)}
        >
          <span className="tc mono">{fmtClock(s.startSec)}</span>
          <span className="ct">
            {s.title}
            {s.summary && (
              <span style={{ display: "block", fontSize: 11.5, color: "var(--ink-3)" }}>
                {s.summary}
              </span>
            )}
          </span>
          {isWatched(s) && (
            <span className="watched-mark" aria-label="시청 완료">●</span>
          )}
        </button>
      ))}
    </>
  );
}
