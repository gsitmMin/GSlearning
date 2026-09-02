import { NextResponse } from "next/server";
import { CONTENTS } from "@/lib/mock-data";
import { getProgress, store } from "@/lib/store";
import { resumePosition } from "@/lib/intervals";

/**
 * GET /learning/contents/{id}/player — PRD FR-L-01/02
 * 실제 구현: 접근권한(ACL) 검증 후 embed 설정만 반환.
 * Vimeo API 액세스 토큰은 절대 포함하지 않는다.
 */
export async function GET(
  _req: Request,
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
  const progress = getProgress(id);
  return NextResponse.json({
    success: true,
    data: {
      providerVideoId: content.providerVideoId,
      durationSec: content.durationSec,
      // PRD §13 기술결정 11 — 플레이어 옵션 (실물 교체 시 그대로 사용)
      embedOptions: {
        title: false,
        byline: false,
        portrait: false,
        autopause: false,
        playsinline: true,
        speed: true,
      },
      resumeAt: progress.completed
        ? 0
        : resumePosition(progress.intervals, progress.lastPositionSec, content.durationSec),
      segments: store.segments.get(id) ?? [],
      progress,
    },
  });
}
