import { NextResponse } from "next/server";
import { store } from "@/lib/store";

export async function GET(
  _req: Request,
  ctx: { params: Promise<{ id: string }> }
) {
  const { id } = await ctx.params;
  return NextResponse.json({ success: true, data: store.segments.get(id) ?? [] });
}
