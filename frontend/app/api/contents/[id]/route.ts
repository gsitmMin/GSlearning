import { NextResponse } from "next/server";
import { CONTENTS } from "@/lib/mock-data";

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
  return NextResponse.json({ success: true, data: content });
}
