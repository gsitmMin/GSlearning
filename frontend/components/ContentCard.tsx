import Link from "next/link";
import Thumb from "./Thumb";
import { fmtMin } from "@/lib/format";

export type ContentSummary = {
  id: string;
  title: string;
  durationSec: number;
  difficulty: string;
  orgScope: string;
  tone: number;
  segmentCount: number;
};

export default function ContentCard({
  c,
  percent,
}: {
  c: ContentSummary;
  percent?: number;
}) {
  return (
    <Link href={`/contents/${c.id}`} className="card content-card">
      <Thumb tone={c.tone} duration={fmtMin(c.durationSec)} resumeRatio={percent} />
      <div className="body">
        <span className="title">{c.title}</span>
        <div className="meta-row">
          <span className="badge official">사내 공식</span>
          <span>{c.difficulty}</span>
          <span className="sep" /> <span>{c.orgScope}</span>
          {c.segmentCount > 0 && (
            <>
              <span className="sep" /> <span>챕터 {c.segmentCount}</span>
            </>
          )}
        </div>
        {percent !== undefined && percent > 0 && (
          <div className="meta-row">
            {percent >= 90 ? (
              <span className="badge done">완료</span>
            ) : (
              <span className="badge progressing num">{Math.round(percent)}% 시청</span>
            )}
          </div>
        )}
      </div>
    </Link>
  );
}
