/** 시간·표기 유틸 */

export function fmtClock(sec: number): string {
  const s = Math.max(0, Math.floor(sec));
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const r = s % 60;
  const mm = h > 0 ? String(m).padStart(2, "0") : String(m);
  return (h > 0 ? `${h}:${mm}:` : `${mm}:`) + String(r).padStart(2, "0");
}

export function fmtMin(sec: number): string {
  if (sec < 60) return `${Math.max(0, Math.round(sec))}초`;
  const m = Math.round(sec / 60);
  if (m < 60) return `${m}분`;
  const h = Math.floor(m / 60);
  const r = m % 60;
  return r === 0 ? `${h}시간` : `${h}시간 ${r}분`;
}

/** D-day 계산 — 음수면 초과 */
export function dDay(dueOn: string): number {
  const due = new Date(`${dueOn}T23:59:59`);
  const now = new Date();
  return Math.ceil((due.getTime() - now.getTime()) / 86_400_000);
}
