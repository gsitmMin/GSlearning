import { NextResponse } from "next/server";
import { COURSES, CONTENTS } from "@/lib/mock-data";

export function GET() {
  const data = COURSES.map((c) => {
    const items = c.modules.flatMap((m) => m.items);
    return {
      courseId: c.id,
      title: c.title,
      description: c.description,
      mandatory: c.mandatory,
      dueOn: c.dueOn ?? null,
      itemCount: items.length,
      totalDurationSec: items.reduce(
        (s, i) => s + (CONTENTS.find((x) => x.id === i.contentId)?.durationSec ?? 0),
        0
      ),
    };
  });
  return NextResponse.json({ success: true, data });
}
