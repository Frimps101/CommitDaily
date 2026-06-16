import { NextResponse } from "next/server";
import { requireUser } from "@/lib/apiAuth";
import { deletePushSubscription } from "@/lib/repositories/pushRepository";
import { pushUnsubscribeSchema } from "@/lib/validation";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function POST(req: Request) {
  const user = await requireUser();
  if (user instanceof NextResponse) return user;

  const body = await req.json().catch(() => null);
  const parsed = pushUnsubscribeSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }

  await deletePushSubscription(parsed.data.endpoint);
  return NextResponse.json({ ok: true });
}
