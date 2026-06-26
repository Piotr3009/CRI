import { NextResponse } from "next/server";
import { incrementVisit } from "@/lib/visits";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Records a single visit. Called once per full page load by VisitTracker.
 * Tracking failures are swallowed so they can never break a page render.
 */
export async function POST() {
  try {
    await incrementVisit();
  } catch {
    // Intentionally ignored — visit tracking is best-effort.
  }
  return new NextResponse(null, { status: 204 });
}
