import { NextResponse } from "next/server";
import { requireUser } from "@/lib/apiAuth";
import { savePushSubscription } from "@/lib/repositories/pushRepository";
import { pushSubscribeSchema } from "@/lib/validation";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function POST(req: Request) {
  const user = await requireUser();
  if (user instanceof NextResponse) return user;

  const body = await req.json().catch(() => null);
  const parsed = pushSubscribeSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid subscription" }, { status: 400 });
  }

  await savePushSubscription(user.id, {
    endpoint: parsed.data.endpoint,
    p256dh: parsed.data.keys.p256dh,
    auth: parsed.data.keys.auth,
    userAgent: parsed.data.userAgent ?? null,
  });

  return NextResponse.json({ ok: true });
}
