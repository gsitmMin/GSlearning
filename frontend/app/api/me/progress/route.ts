import { NextResponse } from "next/server";
import { store } from "@/lib/store";

export function GET() {
  return NextResponse.json({
    success: true,
    data: Object.fromEntries(store.progress.entries()),
  });
}
