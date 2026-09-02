/**
 * PRD §7 — 시청 구간 누적 로직 (순수 함수)
 *
 * 이 파일이 진도 추적의 스펙입니다. Spring Boot 구현 시 이 함수들을
 * 그대로 Java로 포팅합니다 (learning 모듈 / ProgressService).
 */
import type { Interval } from "./types";

/** 겹치거나 맞닿은(gap ≤ mergeGapSec) 구간을 합집합으로 병합 */
export function mergeIntervals(list: Interval[], mergeGapSec = 1): Interval[] {
  if (list.length === 0) return [];
  const sorted = [...list].sort((a, b) => a.start - b.start);
  const out: Interval[] = [{ ...sorted[0] }];
  for (let i = 1; i < sorted.length; i++) {
    const cur = sorted[i];
    const last = out[out.length - 1];
    if (cur.start <= last.end + mergeGapSec) {
      last.end = Math.max(last.end, cur.end);
    } else {
      out.push({ ...cur });
    }
  }
  return out;
}

/** 병합된 구간의 총 시청 시간(초) */
export function watchedSec(merged: Interval[]): number {
  return merged.reduce((s, iv) => s + (iv.end - iv.start), 0);
}

/** 진도율(%) — PRD FR-L-04 */
export function percentOf(merged: Interval[], durationSec: number): number {
  if (durationSec <= 0) return 0;
  return Math.min(100, Math.round((watchedSec(merged) / durationSec) * 1000) / 10);
}

export type ValidationResult = {
  accepted: Interval[];
  rejected: { interval: Interval; reason: string }[];
};

/** 구간 범위 검증 — PRD §7.3 (0 ≤ start < end ≤ duration) */
export function validateRange(
  incoming: Interval[],
  durationSec: number
): ValidationResult {
  const accepted: Interval[] = [];
  const rejected: ValidationResult["rejected"] = [];
  for (const iv of incoming) {
    if (
      !Number.isFinite(iv.start) ||
      !Number.isFinite(iv.end) ||
      iv.start < 0 ||
      iv.end <= iv.start ||
      iv.end > durationSec + 1 // 마지막 프레임 오차 허용
    ) {
      rejected.push({ interval: iv, reason: "RANGE" });
    } else {
      accepted.push({ start: iv.start, end: Math.min(iv.end, durationSec) });
    }
  }
  return { accepted, rejected };
}

/**
 * 최대 증가량 검증 — PRD §7.3
 * 신규 시청량 ≤ 경과 실시간 × 최대배속(2) × 여유계수(1.5)
 * 물리적으로 불가능한 보고(조작·버그)를 거부합니다.
 */
export function violatesMaxGain(
  prevMerged: Interval[],
  nextMerged: Interval[],
  elapsedMs: number,
  maxRate = 2,
  slack = 1.5
): boolean {
  const gain = watchedSec(nextMerged) - watchedSec(prevMerged);
  const allowed = (elapsedMs / 1000) * maxRate * slack + 3; // +3초 타이머 오차
  return gain > allowed;
}

/**
 * 이어보기 지점 — PRD §6.4 동작규칙 1
 * lastPosition이 이미 본 구간 안에 있으면 그 구간의 끝으로 스냅한다.
 * (앞부분을 잠깐 다시 확인한 뒤 이탈해도 "0:03부터 이어보기"가 되지 않도록)
 * 시작 직후(10초 미만)나 사실상 끝까지 본 경우에는 이어보기를 제안하지 않는다.
 */
export function resumePosition(
  merged: Interval[],
  lastPositionSec: number,
  durationSec: number
): number {
  const containing = merged.find(
    (iv) => lastPositionSec >= iv.start - 1 && lastPositionSec <= iv.end + 1
  );
  const pos = containing ? containing.end : lastPositionSec;
  if (pos < 10 || pos >= durationSec - 5) return 0;
  return Math.round(pos);
}
