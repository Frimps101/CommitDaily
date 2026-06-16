import { NextResponse } from "next/server";
import { requireUser } from "@/lib/apiAuth";
import { sendPushToUser } from "@/lib/services/notificationService";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

/**
 * Sends a test push to the current user's devices. Use this to verify the
 * iOS-installed-PWA constraint explicitly: open the installed PWA on iOS 16.4+,
 * enable notifications, then trigger this and confirm delivery.
 */
export async function POST() {
  const user = await requireUser();
  if (user instanceof NextResponse) return user;

  try {
    const result = await sendPushToUser(user.id, {
      title: "CommitDaily test",
      body: "Push notifications are working. You'll be nudged before you lose a day.",
      url: "/",
      tag: "commitdaily-test",
    });
    return NextResponse.json({ ok: true, ...result });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Push failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
