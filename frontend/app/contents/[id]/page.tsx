"use client";
/** 영상 시청 페이지 — PRD §6.4 */
import { useCallback, useEffect, useRef, useState } from "react";
import { useParams } from "next/navigation";
import MockPlayer, { type PlayerHandle } from "@/components/MockPlayer";
import ChapterList from "@/components/ChapterList";
import { useProgressTracker } from "@/lib/useProgressTracker";
import { fmtClock, fmtMin } from "@/lib/format";
import { mergeIntervals, watchedSec } from "@/lib/intervals";
import type { Content, Segment, VideoProgress } from "@/lib/types";

type PlayerInfo = {
  durationSec: number;
  resumeAt: number;
  segments: Segment[];
  progress: VideoProgress;
};

export default function WatchPage() {
  const { id } = useParams<{ id: string }>();
  const [content, setContent] = useState<Content | null>(null);
  const [info, setInfo] = useState<PlayerInfo | null>(null);
  const [resumeDismissed, setResumeDismissed] = useState(false);
  const [tab, setTab] = useState<"chapters" | "desc" | "files">("desc");
  const [devOpen, setDevOpen] = useState(false);
  const [now, setNow] = useState(0);
  const playerRef = useRef<PlayerHandle>(null);
  const railRef = useRef<HTMLDivElement>(null);

  const tracker = useProgressTracker(id, info?.progress ?? null);

  useEffect(() => {
    void (async () => {
      const [c, p] = await Promise.all([
        fetch(`/api/contents/${id}`).then((r) => r.json()),
        fetch(`/api/learning/contents/${id}/player`).then((r) => r.json()),
      ]);
      if (c.success) setContent(c.data);
      if (p.success) setInfo(p.data);
    })();
  }, [id]);

  const onTimeUpdate = useCallback(
    (sec: number) => {
      tracker.onTimeUpdate(sec);
      setNow(sec);
    },
    [tracker]
  );
  const onSeeked = useCallback(
    (from: number, to: number) => {
      tracker.onSeeked(from, to);
      setNow(to);
    },
    [tracker]
  );

  // 현재 챕터 강조 + 자동 스크롤 (§6.4 동작규칙 3)
  const segs = info?.segments ?? [];
  const currentSegIdx = segs.findIndex((s) => now >= s.startSec && now < s.endSec);
  useEffect(() => {
    const el = railRef.current?.querySelector<HTMLElement>(".chapter-item.current");
    el?.scrollIntoView({ block: "nearest" });
  }, [currentSegIdx]);

  if (!content || !info) {
    return <main className="page"><p className="empty">불러오는 중…</p></main>;
  }

  const server = tracker.server ?? info.progress;
  // 화면 표시는 서버 확정값 + 이번 세션 로컬 구간의 합집합
  const displayIntervals = mergeIntervals([...server.intervals, ...tracker.localMerged()]);
  const displayWatched = watchedSec(displayIntervals);
  const displayPercent = Math.min(100, Math.round((displayWatched / content.durationSec) * 1000) / 10);
  const isDone = server.completed || displayPercent >= 90;

  const chapterWatched = (s: Segment) => {
    const within = displayIntervals
      .map((iv) => Math.max(0, Math.min(iv.end, s.endSec) - Math.max(iv.start, s.startSec)))
      .reduce((a, b) => a + b, 0);
    return within / (s.endSec - s.startSec) >= 0.9;
  };
  const watchedChapterCount = segs.filter(chapterWatched).length;

  const jumpTo = (startSec: number) => {
    playerRef.current?.setCurrentTime(startSec);
    playerRef.current?.play();
  };

  const resume = () => {
    playerRef.current?.setCurrentTime(info.resumeAt);
    playerRef.current?.play();
    setResumeDismissed(true);
  };

  return (
    <main className="page">
      <div className="watch-layout">
        <div>
          <div className="player-sticky">
          <MockPlayer
            ref={playerRef}
            durationSec={content.durationSec}
            segments={segs}
            watchedIntervals={displayIntervals}
            onTimeUpdate={onTimeUpdate}
            onSeeked={onSeeked}
            onPlayState={tracker.onPlayState}
            onEnded={tracker.onEnded}
          />
          </div>

          {/* 이어보기 — 자동 이동하지 않고 안내만 (§6.4 동작규칙 1) */}
          {info.resumeAt > 0 && !resumeDismissed && !isDone && (
            <div className="resume-banner">
              <span>
                지난 시청 위치 <b className="mono">{fmtClock(info.resumeAt)}</b>부터 이어볼 수 있습니다.
              </span>
              <button className="btn sm primary" onClick={resume}>이어보기</button>
              <button className="x" aria-label="닫기" onClick={() => setResumeDismissed(true)}>✕</button>
            </div>
          )}

          <div className="watch-title-row">
            <h1>{content.title}</h1>
            {isDone && <span className="badge done">완료</span>}
          </div>
          <p className="watch-meta">
            {fmtMin(content.durationSec)} · 사내 공식 · {content.orgScope} · {content.difficulty}
          </p>

          {/* 서버 기준 진도 — 누적 시청 구간 시각화 (§6.4 동작규칙 4) */}
          <div className="card progress-panel">
            <div className="row">
              <span>
                진도 <b className="num">{displayPercent}%</b>
                <span style={{ color: "var(--ink-3)" }}> · 실제 시청 {fmtMin(displayWatched)}</span>
              </span>
              <span className="mono" style={{ fontSize: 12 }}>
                {fmtClock(server.lastPositionSec)} / {fmtClock(content.durationSec)}
              </span>
            </div>
            <div className={`itrack ${isDone ? "done" : ""}`} aria-label="누적 시청 구간">
              {displayIntervals.map((iv, i) => (
                <i
                  key={i}
                  style={{
                    left: `${(iv.start / content.durationSec) * 100}%`,
                    width: `${((iv.end - iv.start) / content.durationSec) * 100}%`,
                  }}
                />
              ))}
            </div>
            <div className="row" style={{ fontSize: 12, color: "var(--ink-3)" }}>
              <span>Seek으로 건너뛴 구간은 진도에 포함되지 않습니다 (완료 기준 90%)</span>
            </div>
          </div>

          {/* 설명 / 첨부자료 */}
          <div className="tabs" role="tablist">
            <button
              role="tab"
              aria-selected={tab === "chapters"}
              className={`only-narrow ${tab === "chapters" ? "active" : ""}`}
              onClick={() => setTab("chapters")}
            >
              챕터 {segs.length > 0 && `(${watchedChapterCount}/${segs.length})`}
            </button>
            <button role="tab" aria-selected={tab === "desc"} className={tab === "desc" ? "active" : ""} onClick={() => setTab("desc")}>설명</button>
            <button role="tab" aria-selected={tab === "files"} className={tab === "files" ? "active" : ""} onClick={() => setTab("files")}>
              첨부자료{content.attachments.length > 0 && ` (${content.attachments.length})`}
            </button>
          </div>
          <div className="tab-body" style={tab === "chapters" ? { maxWidth: "none" } : undefined}>
            {tab === "chapters" ? (
              <div className="chapter-tab-list">
                <ChapterList
                  segments={segs}
                  currentIdx={currentSegIdx}
                  isWatched={chapterWatched}
                  onJump={jumpTo}
                />
              </div>
            ) : tab === "desc" ? (
              <p>{content.description}</p>
            ) : content.attachments.length === 0 ? (
              <p className="empty">첨부자료가 없습니다.</p>
            ) : (
              content.attachments.map((a) => (
                <div className="attach" key={a.name}>
                  <span aria-hidden>📄</span> {a.name}
                  <span className="size">{a.size}</span>
                </div>
              ))
            )}
          </div>

          {/* 진도 검증 패널 — 프로토타입 전용 (§7 시연) */}
          <div className="dev-panel">
            <button className="head" onClick={() => setDevOpen(!devOpen)} aria-expanded={devOpen}>
              <span aria-hidden>{devOpen ? "▾" : "▸"}</span> 진도 검증 패널 — PRD §7 로직 확인용 (프로토타입 전용)
            </button>
            {devOpen && (
              <div className="dev-body">
                <div>
                  <h4>누적 시청 구간 (병합 결과)</h4>
                  <table className="mono">
                    <thead><tr><th>시작</th><th>종료</th><th>길이</th></tr></thead>
                    <tbody>
                      {displayIntervals.map((iv, i) => (
                        <tr key={i}>
                          <td>{fmtClock(iv.start)}</td>
                          <td>{fmtClock(iv.end)}</td>
                          <td>{Math.round(iv.end - iv.start)}초</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  <p style={{ marginTop: 10, color: "var(--ink-3)" }}>
                    서버 확정 {server.percent}% · 세션 반영 {displayPercent}%
                  </p>
                  <button
                    className="btn sm"
                    style={{ marginTop: 10 }}
                    onClick={() => void tracker.sendForged(content.durationSec)}
                  >
                    조작 요청 테스트 (전체 구간 즉시 전송)
                  </button>
                </div>
                <div>
                  <h4>전송 로그 (10초 주기 · 일시정지 · 이탈 시)</h4>
                  {tracker.log.length === 0 && <p style={{ color: "var(--ink-3)" }}>아직 전송 없음 — 재생하면 기록됩니다.</p>}
                  {tracker.log.map((l, i) => (
                    <div className="log-line" key={i}>
                      <span className="mono" style={{ marginRight: 8 }}>{l.at}</span>
                      <span className={l.ok ? "ok" : "rej"}>{l.ok ? "✓" : "✕"}</span> {l.note}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* 챕터 레일 (§6.4 우측 고정) */}
        <aside className="card chapter-rail" ref={railRef}>
          <div className="rail-head">
            <h3>챕터</h3>
            <span style={{ fontSize: 12, color: "var(--ink-3)" }} className="num">
              {watchedChapterCount}/{segs.length} 시청
            </span>
          </div>
          <div className="chapter-list">
            <ChapterList
              segments={segs}
              currentIdx={currentSegIdx}
              isWatched={chapterWatched}
              onJump={jumpTo}
            />
          </div>
          <div className="rail-foot">
            <div className="pbar-label" style={{ marginTop: 0 }}>
              <span>이 영상 진도</span>
              <b className="num">{displayPercent}%</b>
            </div>
            <div className={`pbar ${isDone ? "done" : ""}`}>
              <i style={{ width: `${displayPercent}%` }} />
            </div>
          </div>
        </aside>
      </div>
    </main>
  );
}
