"use client";
/** Vimeo 라이브러리 — 실 Vimeo 계정 연동 (FR-C-01/02, 업로드 미구현은 §13-7) */
import { useCallback, useEffect, useState } from "react";
import { api } from "@/lib/api";
import { fmtClock } from "@/lib/format";

type VimeoItem = {
  vimeoId: string;
  name: string;
  durationSec: number;
  createdAt: string;
  privacyEmbed: string;
  imported: boolean;
};

export default function VimeoLibraryPage() {
  const [videos, setVideos] = useState<VimeoItem[]>([]);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [toast, setToast] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      setVideos(await api<VimeoItem[]>("/admin/vimeo/videos"));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { void load(); }, [load]);

  const say = (msg: string) => { setToast(msg); setTimeout(() => setToast(null), 3500); };

  const toggle = (id: string) => {
    const next = new Set(selected);
    if (next.has(id)) next.delete(id); else next.add(id);
    setSelected(next);
  };

  const doImport = async () => {
    const created = await api<unknown[]>("/admin/vimeo/videos/import", {
      method: "POST",
      body: JSON.stringify({ vimeoIds: [...selected] }),
    });
    say(`${created.length}개 영상을 콘텐츠로 등록했습니다 (DRAFT — 게시 후 학습자에게 노출)`);
    setSelected(new Set());
    await load();
  };

  const notImported = videos.filter((v) => !v.imported);

  return (
    <>
      <div className="page-head">
        <h1>Vimeo 라이브러리</h1>
        <div style={{ display: "flex", gap: 8 }}>
          <button className="btn sm" onClick={() => void load().then(() => say("Vimeo 계정과 동기화했습니다"))}>
            ↻ 동기화
          </button>
          <button className="btn sm primary" disabled={selected.size === 0} onClick={() => void doImport()}>
            {selected.size > 0 ? `선택한 ${selected.size}개 가져오기` : "가져오기"}
          </button>
        </div>
      </div>
      <p style={{ fontSize: 13, color: "var(--ink-2)", marginBottom: 16, maxWidth: "70ch" }}>
        영상 업로드는 Vimeo 웹에서 진행합니다. 여기서는 조직 계정의 영상을 <b>콘텐츠로 가져오기</b>만 합니다.
      </p>
      <div className="card" style={{ overflowX: "auto" }}>
        <table className="data-table">
          <thead>
            <tr><th style={{ width: 36 }}></th><th>Vimeo 영상</th><th>길이</th><th>업로드일</th><th>embed</th><th>상태</th></tr>
          </thead>
          <tbody>
            {loading && <tr><td colSpan={6} className="empty">Vimeo에서 불러오는 중…</td></tr>}
            {!loading && videos.map((v) => (
              <tr key={v.vimeoId}>
                <td>
                  {!v.imported && (
                    <input type="checkbox" checked={selected.has(v.vimeoId)} onChange={() => toggle(v.vimeoId)} aria-label={`${v.name} 선택`} />
                  )}
                </td>
                <td>
                  <span style={{ fontWeight: 600 }}>{v.name}</span>
                  <span className="mono" style={{ display: "block", fontSize: 11.5, color: "var(--ink-3)" }}>vimeo.com/{v.vimeoId}</span>
                </td>
                <td className="mono">{fmtClock(v.durationSec)}</td>
                <td style={{ color: "var(--ink-3)" }}>{v.createdAt}</td>
                <td><span className={`badge ${v.privacyEmbed === "public" ? "neutral" : "official"}`}>{v.privacyEmbed}</span></td>
                <td>{v.imported ? <span className="badge neutral">등록됨</span> : <span className="badge draft">미등록</span>}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p style={{ fontSize: 12, color: "var(--ink-3)", marginTop: 10 }}>
        미등록 {notImported.length}개 · <code>GET /admin/vimeo/videos</code> → <code>POST /admin/vimeo/videos/import</code> (PRD §9)
      </p>
      {toast && <div className="toast" role="status">{toast}</div>}
    </>
  );
}
