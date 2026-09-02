import { NextResponse } from "next/server";
import { CONTENTS } from "@/lib/mock-data";
import { store } from "@/lib/store";
import type { Segment } from "@/lib/types";

/**
 * PUT /admin/contents/{id}/segments — FR-S-01/02 검증 포함.
 * 저장하면 학습자 시청 페이지의 챕터 패널에 즉시 반영됩니다.
 */
export async function PUT(
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
  const body = (await req.json()) as { segments: Segment[] };
  for (const s of body.segments) {
    if (s.endSec <= s.startSec) {
      return NextResponse.json(
        { success: false, error: { code: "VALIDATION", message: `"${s.title}": 종료가 시작보다 빠릅니다.` } },
        { status: 400 }
      );
    }
    if (s.endSec > content.durationSec) {
      return NextResponse.json(
        { success: false, error: { code: "VALIDATION", message: `"${s.title}": 영상 길이(${content.durationSec}초)를 초과합니다.` } },
        { status: 400 }
      );
    }
  }
  const sorted = [...body.segments]
    .sort((a, b) => a.startSec - b.startSec)
    .map((s, i) => ({ ...s, sequenceNo: i + 1 }));
  store.segments.set(id, sorted);
  return NextResponse.json({ success: true, data: sorted });
}
