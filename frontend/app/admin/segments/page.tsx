"use client";
/** 챕터 편집기 — FR-S-01/02. 저장하면 학습자 시청 페이지에 즉시 반영됩니다. */
import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { api } from "@/lib/api";
import type { ContentSummary } from "@/components/ContentCard";
import { fmtClock } from "@/lib/format";
import type { Segment } from "@/lib/types";

type Row = { key: string; start: string; end: string; title: string };

const toClock = (sec: number) => fmtClock(sec);
/** "31:20" | "1:02:05" | "1900" → 초 */
function parseClock(v: string): number | null {
  const t = v.trim();
  if (/^\d+$/.test(t)) return Number(t);
  const parts = t.split(":").map((x) => x.trim());
  if (parts.some((p) => p === "" || !/^\d+$/.test(p))) return null;
  if (parts.length === 2) return Number(parts[0]) * 60 + Number(parts[1]);
  if (parts.length === 3) return Number(parts[0]) * 3600 + Number(parts[1]) * 60 + Number(parts[2]);
  return null;
}

export default function SegmentEditorPage() {
  const [editable, setEditable] = useState<ContentSummary[]>([]);
  const [contentId, setContentId] = useState<string>("");
  const content = editable.find((c) => c.id === contentId);
  const [rows, setRows] = useState<Row[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [toast, setToast] = useState<string | null>(null);

  useEffect(() => {
    void api<ContentSummary[]>("/admin/contents").then((list) => {
      setEditable(list);
      if (list.length > 0) setContentId((cur) => cur || list[0].id);
    });
  }, []);

  useEffect(() => {
    if (!contentId) return;
    void api<Segment[]>(`/contents/${contentId}/segments`).then((segs) =>
      setRows(
        segs.map((s) => ({
          key: s.id,
          start: toClock(s.startSec),
          end: toClock(s.endSec),
          title: s.title,
        }))
      )
    );
    setError(null);
  }, [contentId]);

  const parsed = useMemo(
    () =>
      rows.map((r) => ({
        ...r,
        startSec: parseClock(r.start),
        endSec: parseClock(r.end),
      })),
    [rows]
  );

  const rowInvalid = (r: (typeof parsed)[number]) =>
    r.startSec === null ||
    r.endSec === null ||
    r.endSec <= r.startSec ||
    (content !== undefined && r.endSec > content.durationSec);

  const update = (key: string, field: keyof Row, value: string) =>
    setRows((rs) => rs.map((r) => (r.key === key ? { ...r, [field]: value } : r)));

  const addRow = () => {
    if (!content) return;
    const lastEnd = parsed.length > 0 ? parsed[parsed.length - 1].endSec ?? 0 : 0;
    setRows((rs) => [
      ...rs,
      { key: `new-${Date.now()}`, start: toClock(lastEnd), end: toClock(Math.min(lastEnd + 60, content.durationSec)), title: "" },
    ]);
  };

  const save = async () => {
    if (!content) return;
    setError(null);
    const bad = parsed.find(rowInvalid);
    if (bad) {
      setError(`"${bad.title || "제목 없음"}" 행의 구간이 올바르지 않습니다 — 종료 > 시작, 영상 길이(${fmtClock(content.durationSec)}) 이내여야 합니다.`);
      return;
    }
    const segments = parsed.map((r) => ({
      startSec: r.startSec!,
      endSec: r.endSec!,
      title: r.title,
    }));
    try {
      const saved = await api<Segment[]>(`/admin/contents/${contentId}/segments`, {
        method: "PUT",
        body: JSON.stringify({ segments }),
      });
      setRows(saved.map((s) => ({ key: s.id, start: toClock(s.startSec), end: toClock(s.endSec), title: s.title })));
      setToast("저장했습니다 — 학습자 시청 페이지에 바로 반영됩니다");
      setTimeout(() => setToast(null), 3000);
    } catch (e) {
      setError(e instanceof Error ? e.message : "저장에 실패했습니다.");
    }
  };

  return (
    <>
      <div className="page-head">
        <h1>챕터 편집기</h1>
        <div style={{ display: "flex", gap: 8 }}>
          <Link href={`/contents/${contentId}`} className="btn sm">학습자 화면에서 확인 →</Link>
          <button className="btn sm primary" onClick={() => void save()}>저장</button>
        </div>
      </div>

      <div className="filter-row">
        <select
          value={contentId}
          onChange={(e) => setContentId(e.target.value)}
          className="search-input"
          style={{ width: 360 }}
          aria-label="편집할 콘텐츠 선택"
        >
          {editable.map((c) => (
            <option key={c.id} value={c.id}>[{c.publishStatus === "DRAFT" ? "작성중" : "게시"}] {c.title} ({fmtClock(c.durationSec)})</option>
          ))}
        </select>
      </div>

      {/* 타임라인 미리보기 */}
      {content && (
      <div className="seg-timeline" aria-hidden>
        {parsed.filter((r) => !rowInvalid(r)).map((r) => (
          <span
            key={r.key}
            className="seg-block"
            style={{
              left: `${(r.startSec! / content.durationSec) * 100}%`,
              width: `${((r.endSec! - r.startSec!) / content.durationSec) * 100}%`,
            }}
          >
            {r.title}
          </span>
        ))}
      </div>
      )}

      <div className="card" style={{ padding: "16px 18px" }}>
        <div className="seg-form-row" style={{ color: "var(--ink-3)", fontSize: 12 }}>
          <span>시작</span><span>종료</span><span>제목</span><span />
        </div>
        {parsed.map((r) => (
          <div className="seg-form-row" key={r.key}>
            <input className={`mono ${rowInvalid(r) ? "err" : ""}`} value={r.start} onChange={(e) => update(r.key, "start", e.target.value)} aria-label="시작 시각" />
            <input className={`mono ${rowInvalid(r) ? "err" : ""}`} value={r.end} onChange={(e) => update(r.key, "end", e.target.value)} aria-label="종료 시각" />
            <input value={r.title} placeholder="챕터 제목" onChange={(e) => update(r.key, "title", e.target.value)} aria-label="챕터 제목" />
            <button className="icon-btn" onClick={() => setRows((rs) => rs.filter((x) => x.key !== r.key))} aria-label="행 삭제">✕</button>
          </div>
        ))}
        <button className="btn sm" onClick={addRow} style={{ marginTop: 6 }}>+ 챕터 추가</button>
        {error && <p className="form-error">{error}</p>}
        <p style={{ fontSize: 12, color: "var(--ink-3)", marginTop: 12 }}>
          시각은 <span className="mono">31:20</span> 또는 <span className="mono">1:02:05</span> 형식 ·
          실제 구현: <code>PUT /admin/contents/{"{id}"}/segments</code> — 구간 겹침은 경고만 (FR-S-03)
        </p>
      </div>
      {toast && <div className="toast" role="status">{toast}</div>}
    </>
  );
}
