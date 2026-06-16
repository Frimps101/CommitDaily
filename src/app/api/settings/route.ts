import { NextResponse } from "next/server";
import { requireUser } from "@/lib/apiAuth";
import {
  getOrCreateSettings,
  updateSettings,
} from "@/lib/repositories/settingsRepository";
import { settingsUpdateSchema } from "@/lib/validation";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

function toPublic(s: Awaited<ReturnType<typeof getOrCreateSettings>>) {
  return {
    timezone: s.timezone,
    dailyThreshold: s.dailyThreshold,
    freezeEnabled: s.freezeEnabled,
    reminderTime: s.reminderTime,
    lastCallEnabled: s.lastCallEnabled,
    lastCallTime: s.lastCallTime,
    goalTotal: s.goalTotal,
  };
}

export async function GET() {
  const user = await requireUser();
  if (user instanceof NextResponse) return user;
  const settings = await getOrCreateSettings(user.id);
  return NextResponse.json(toPublic(settings));
}

export async function PATCH(req: Request) {
  const user = await requireUser();
  if (user instanceof NextResponse) return user;

  const body = await req.json().catch(() => null);
  const parsed = settingsUpdateSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid settings", issues: parsed.error.flatten() },
      { status: 400 },
    );
  }

  const updated = await updateSettings(user.id, parsed.data);
  return NextResponse.json(toPublic(updated));
}
