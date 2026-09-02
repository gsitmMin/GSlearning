import { NextResponse } from "next/server";
import { COURSES, CONTENTS } from "@/lib/mock-data";
import { getProgress } from "@/lib/store";

/**
 * GET /me/enrollments — 과정별 진도를 계산해 반환.
 * 과정 상태 판정(FR-K-06): 필수 항목이 모두 완료 기준을 넘으면 COMPLETED.
 * 진도 표기(FR-K-09): 완료 항목 수 + 비율.
 */
export function GET() {
  const data = COURSES.map((course) => {
    const items = course.modules.flatMap((m) =>
      m.items.map((item) => {
        const content = CONTENTS.find((c) => c.id === item.contentId)!;
        const p = getProgress(item.contentId);
        const done = p.percent >= item.minProgressPercent || p.completed;
        return {
          ...item,
          moduleId: m.id,
          title: content.title,
          durationSec: content.durationSec,
          percent: p.percent,
          lastPositionSec: p.lastPositionSec,
          done,
          started: p.watchedSec > 0,
        };
      })
    );
    const required = items.filter((i) => i.required);
    const doneCount = required.filter((i) => i.done).length;
    const percent =
      required.length === 0
        ? 0
        : Math.round(required.reduce((s, i) => s + Math.min(100, i.percent), 0) / required.length);
    const status =
      doneCount === required.length ? "COMPLETED" : percent > 0 ? "IN_PROGRESS" : "ENROLLED";
    return {
      courseId: course.id,
      title: course.title,
      description: course.description,
      mandatory: course.mandatory,
      dueOn: course.dueOn ?? null,
      modules: course.modules.map((m) => ({
        id: m.id,
        title: m.title,
        items: items.filter((i) => i.moduleId === m.id),
      })),
      requiredTotal: required.length,
      requiredDone: doneCount,
      percent,
      status,
      totalDurationSec: items.reduce((s, i) => s + i.durationSec, 0),
    };
  });
  return NextResponse.json({ success: true, data });
}
