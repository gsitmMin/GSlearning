/**
 * 프로토타입용 인메모리 저장소.
 * 실제 구현에서는 Spring Boot + PostgreSQL(video_progress / video_progress_interval)이
 * 이 역할을 합니다 (PRD §8). dev 서버 재시작 시 초기화됩니다.
 */
import type { Interval, VideoProgress, Segment } from "./types";
import { mergeIntervals, watchedSec, percentOf } from "./intervals";
import { CONTENTS } from "./mock-data";

type Store = {
  progress: Map<string, VideoProgress>;
  lastReportAt: Map<string, number>;
  segments: Map<string, Segment[]>;
};

function seedProgress(contentId: string, intervals: Interval[], lastPos: number): VideoProgress {
  const content = CONTENTS.find((c) => c.id === contentId)!;
  const merged = mergeIntervals(intervals);
  const percent = percentOf(merged, content.durationSec);
  return {
    contentId,
    intervals: merged,
    watchedSec: watchedSec(merged),
    percent,
    lastPositionSec: lastPos,
    completed: percent >= 90,
    updatedAt: Date.now() - 86_400_000, // 어제
  };
}

function createStore(): Store {
  const progress = new Map<string, VideoProgress>();
  // 시나리오 시드: 보안 1편 완료, 2편 68% 시청 중, Spring 교육 일부 시청
  progress.set("CONT-003", seedProgress("CONT-003", [{ start: 0, end: 720 }], 720));
  progress.set("CONT-004", seedProgress("CONT-004", [{ start: 0, end: 734 }], 734));
  progress.set("CONT-001", seedProgress("CONT-001", [{ start: 0, end: 300 }, { start: 1880, end: 2530 }], 2530));
  const segments = new Map<string, Segment[]>();
  for (const c of CONTENTS) segments.set(c.id, [...c.segments]);
  return { progress, lastReportAt: new Map(), segments };
}

// dev 핫리로드에도 상태가 유지되도록 globalThis에 보관
const g = globalThis as unknown as { __lmsStore?: Store };
export const store: Store = (g.__lmsStore ??= createStore());

export function getProgress(contentId: string): VideoProgress {
  return (
    store.progress.get(contentId) ?? {
      contentId,
      intervals: [],
      watchedSec: 0,
      percent: 0,
      lastPositionSec: 0,
      completed: false,
      updatedAt: 0,
    }
  );
}
