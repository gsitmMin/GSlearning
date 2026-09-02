/** 목 썸네일 — 실제 구현에서는 Vimeo 썸네일 URL 사용 (video_asset.thumbnail) */
export default function Thumb({
  tone,
  duration,
  resumeRatio,
  children,
}: {
  tone: number;
  duration?: string;
  resumeRatio?: number;
  children?: React.ReactNode;
}) {
  return (
    <div
      className="thumb"
      style={{
        background: `linear-gradient(135deg, hsl(${tone} 32% 30%), hsl(${(tone + 40) % 360} 38% 18%))`,
      }}
    >
      <svg width="34" height="34" viewBox="0 0 34 34" aria-hidden style={{ position: "absolute", top: "calc(50% - 17px)", left: "calc(50% - 17px)", opacity: 0.9 }}>
        <circle cx="17" cy="17" r="16" fill="rgb(10 15 20 / 0.5)" stroke="rgb(255 255 255 / 0.7)" />
        <path d="M13.5 11.5 L23 17 L13.5 22.5 Z" fill="#fff" />
      </svg>
      {children}
      {duration && <span className="duration mono">{duration}</span>}
      {resumeRatio !== undefined && resumeRatio > 0 && (
        <span className="resume-line" style={{ width: `${Math.min(100, resumeRatio)}%` }} />
      )}
    </div>
  );
}
