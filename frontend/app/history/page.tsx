"use client";
/** 학습 이력 (PRD §6.1) */
import { useEffect, useState } from "react";
import Link from "next/link";
import { api } from "@/lib/api";
import type { ContentSummary } from "@/components/ContentCard";
import { fmtMin } from "@/lib/format";
import type { VideoProgress } from "@/lib/types";

export default function HistoryPage() {
  const [progress, setProgress] = useState<Record<string, VideoProgress>>({});
  const [contents, setContents] = useState<ContentSummary[]>([]);
  const [loaded, setLoaded] = useState(false);
  useEffect(() => {
    void Promise.all([
      api<Record<string, VideoProgress>>("/me/progress"),
      api<ContentSummary[]>("/contents"),
    ]).then(([p, c]) => { setProgress(p); setContents(c); setLoaded(true); });
  }, []);

  const rows = Object.values(progress)
    .filter((p) => p.watchedSec > 0)
    .sort((a, b) => b.updatedAt - a.updatedAt);

  return (
    <main className="page">
      <div className="page-head"><h1>학습 이력</h1></div>
      <div className="card" style={{ overflowX: "auto" }}>
        <table className="data-table">
          <thead>
            <tr><th>콘텐츠</th><th>실제 시청</th><th>진도</th><th>상태</th><th>마지막 시청</th></tr>
          </thead>
          <tbody>
            {!loaded && (
              <tr><td colSpan={5} className="empty">불러오는 중…</td></tr>
            )}
            {loaded && rows.length === 0 && (
              <tr><td colSpan={5} className="empty">시청 기록이 없습니다.</td></tr>
            )}
            {rows.map((p) => {
              const c = contents.find((x) => x.id === p.contentId);
              return (
                <tr key={p.contentId}>
                  <td><Link href={`/contents/${p.contentId}`} style={{ fontWeight: 600 }}>{c?.title ?? p.contentId}</Link></td>
                  <td className="num">{fmtMin(p.watchedSec)}</td>
                  <td className="num">{p.percent}%</td>
                  <td>{p.completed ? <span className="badge done">완료</span> : <span className="badge progressing">진행 중</span>}</td>
                  <td style={{ color: "var(--ink-3)" }}>
                    {p.updatedAt ? new Date(p.updatedAt).toLocaleString("ko-KR", { month: "numeric", day: "numeric", hour: "2-digit", minute: "2-digit" }) : "—"}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </main>
  );
}
