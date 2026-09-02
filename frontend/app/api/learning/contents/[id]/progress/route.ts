import { NextResponse } from "next/server";
import { CONTENTS } from "@/lib/mock-data";
import { getProgress, store } from "@/lib/store";
import {
  mergeIntervals,
  percentOf,
  validateRange,
  violatesMaxGain,
  watchedSec,
} from "@/lib/intervals";
import type { ProgressReport } from "@/lib/types";

/**
 * POST /learning/contents/{id}/progress — PRD §7.2/§7.3
 * 구간 병합은 멱등(FR-L-07): 같은 구간을 다시 보내도 결과가 같다.
 */
export async function POST(
  req: Request,
  ctx: { params: Promise<{ id: string }> }
) {
  const { id } = await ctx.params;
  const content = CONTENTS.find((c) => c.id === id);
  if (!content) {
    return NextResponse.json(
      { success: false, error: { code: "RESOURCE_NOT_FOUND", message: "콘텐츠를 찾을 수 없습니다." } },
      { status: 404 }
    );
  }

  const body = (await req.json()) as ProgressReport;
  const prev = getProgress(id);

  // ① 범위 검증
  const { accepted, rejected } = validateRange(body.intervals ?? [], content.durationSec);

  // ② 병합 (합집합 — 반복 시청은 중복 집계되지 않음)
  const nextMerged = mergeIntervals([...prev.intervals, ...accepted]);

  // ③ 최대 증가량 검증 — 물리적으로 불가능한 보고 거부
  const now = Date.now();
  const lastAt = store.lastReportAt.get(id);
  if (lastAt !== undefined && violatesMaxGain(prev.intervals, nextMerged, now - lastAt)) {
    store.lastReportAt.set(id, now);
    return NextResponse.json({
      success: true,
      data: {
        progress: prev,
        rejected: [
          ...rejected,
          ...accepted.map((interval) => ({ interval, reason: "MAX_GAIN" })),
        ],
      },
    });
  }
  store.lastReportAt.set(id, now);

  const percent = percentOf(nextMerged, content.durationSec);
  const next = {
    contentId: id,
    intervals: nextMerged,
    watchedSec: watchedSec(nextMerged),
    percent,
    lastPositionSec: Math.min(Math.max(0, body.lastPosition ?? prev.lastPositionSec), content.durationSec),
    // 완료 되돌림 금지 (§7.3)
    completed: prev.completed || percent >= 90,
    updatedAt: now,
  };
  store.progress.set(id, next);

  return NextResponse.json({ success: true, data: { progress: next, rejected } });
}
