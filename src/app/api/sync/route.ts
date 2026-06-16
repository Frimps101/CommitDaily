import { NextResponse } from "next/server";
import { requireUser } from "@/lib/apiAuth";
import { syncUserContributions } from "@/lib/services/syncService";
import { getDashboard } from "@/lib/services/dashboardService";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

/** Pull fresh data from GitHub, then return the recomputed dashboard. */
export async function POST() {
  const user = await requireUser();
  if (user instanceof NextResponse) return user;

  try {
    await syncUserContributions(user.id);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Sync failed";
    return NextResponse.json({ error: message }, { status: 502 });
  }

  const payload = await getDashboard(user.id);
  return NextResponse.json(payload);
}
