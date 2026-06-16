import { NextResponse } from "next/server";
import { requireUser } from "@/lib/apiAuth";
import { getDashboard } from "@/lib/services/dashboardService";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET() {
  const user = await requireUser();
  if (user instanceof NextResponse) return user;

  const payload = await getDashboard(user.id);
  return NextResponse.json(payload);
}
