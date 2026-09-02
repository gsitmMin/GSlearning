import { NextResponse } from "next/server";
import { CONTENTS } from "@/lib/mock-data";

/** GET /contents — 학습자에게는 PUBLISHED + AVAILABLE만 노출 (FR-C-06/07) */
export function GET() {
  const data = CONTENTS.filter(
    (c) => c.publishStatus === "PUBLISHED" && c.availabilityStatus === "AVAILABLE"
  ).map(({ segments, ...rest }) => ({ ...rest, segmentCount: segments.length }));
  return NextResponse.json({ success: true, data });
}
