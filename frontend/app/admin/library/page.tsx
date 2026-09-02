"use client";
/** Vimeo 라이브러리 — 가져오기 방식 (FR-C-01/02, 업로드 미구현은 §13 결정 7) */
import { useState } from "react";
import { VIMEO_ACCOUNT_VIDEOS } from "@/lib/mock-data";
import { fmtClock } from "@/lib/format";

export default function VimeoLibraryPage() {
  const [videos, setVideos] = useState(VIMEO_ACCOUNT_VIDEOS);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [toast, setToast] = useState<string | null>(null);

  const notImported = videos.filter((v) => !v.imported);

  const toggle = (id: string) => {
    const next = new Set(selected);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setSelected(next);
  };

  const doImport = () => {
    setVideos((vs) => vs.map((v) => (selected.has(v.vimeoId) ? { ...v, imported: true } : v)));
    setToast(`${selected.size}개 영상을 콘텐츠로 등록했습니다 (DRAFT 상태 — 게시 전 검수 필요)`);
    setSelected(new Set());
    setTimeout(() => setToast(null), 3500);
  };

  return (
    <>
      <div className="page-head">
        <h1>Vimeo 라이브러리</h1>
        <div style={{ display: "flex", gap: 8 }}>
          <button className="btn sm" onClick={() => { setToast("Vimeo 계정과 동기화했습니다 (목)"); setTimeout(() => setToast(null), 2500); }}>
            ↻ 동기화
          </button>
          <button className="btn sm primary" disabled={selected.size === 0} onClick={doImport}>
            {selected.size > 0 ? `선택한 ${selected.size}개 가져오기` : "가져오기"}
          </button>
        </div>
      </div>
      <p style={{ fontSize: 13, color: "var(--ink-2)", marginBottom: 16, maxWidth: "70ch" }}>
        영상 업로드는 Vimeo 웹에서 진행합니다. 여기서는 Vimeo 계정의 영상을 <b>콘텐츠로 가져오기</b>만 합니다.
        가져온 콘텐츠는 DRAFT 상태로 생성되며, 검수 후 게시하면 학습자에게 노출됩니다.
      </p>
      <div className="card" style={{ overflowX: "auto" }}>
        <table className="data-table">
          <thead>
            <tr><th style={{ width: 36 }}></th><th>Vimeo 영상</th><th>길이</th><th>업로드일</th><th>상태</th></tr>
          </thead>
          <tbody>
            {videos.map((v) => (
              <tr key={v.vimeoId}>
                <td>
                  {!v.imported && (
                    <input
                      type="checkbox"
                      checked={selected.has(v.vimeoId)}
                      onChange={() => toggle(v.vimeoId)}
                      aria-label={`${v.name} 선택`}
                    />
                  )}
                </td>
                <td>
                  <span style={{ fontWeight: 600 }}>{v.name}</span>
                  <span className="mono" style={{ display: "block", fontSize: 11.5, color: "var(--ink-3)" }}>vimeo.com/{v.vimeoId}</span>
                </td>
                <td className="mono">{fmtClock(v.durationSec)}</td>
                <td style={{ color: "var(--ink-3)" }}>{v.createdAt}</td>
                <td>{v.imported ? <span className="badge neutral">등록됨</span> : <span className="badge draft">미등록</span>}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p style={{ fontSize: 12, color: "var(--ink-3)", marginTop: 10 }}>
        미등록 {notImported.length}개 · 실제 구현: <code>GET /admin/vimeo/videos</code> → <code>POST /admin/vimeo/videos/import</code> (PRD §9)
      </p>
      {toast && <div className="toast" role="status">{toast}</div>}
    </>
  );
}
