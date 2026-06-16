import { NextResponse } from "next/server";
import { runHeartbeat } from "@/lib/services/heartbeatService";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";
// Allow enough time to process all users sequentially.
export const maxDuration = 60;

/**
 * Protected scheduled "heartbeat". Triggered by Vercel Cron (or a GitHub
 * Actions scheduled workflow) once or twice daily. This — not the client — is
 * what reliably wakes up to check progress and send reminders while the PWA is
 * closed.
 *
 * Auth: requires `Authorization: Bearer <CRON_SECRET>`. Vercel Cron sends this
 * automatically when CRON_SECRET is configured on the project.
 */
export async function GET(req: Request) {
  const secret = process.env.CRON_SECRET;
  if (!secret) {
    return NextResponse.json({ error: "CRON_SECRET not configured" }, { status: 500 });
  }
  const authHeader = req.headers.get("authorization");
  if (authHeader !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const summary = await runHeartbeat();
  return NextResponse.json({ ok: true, ...summary });
}
