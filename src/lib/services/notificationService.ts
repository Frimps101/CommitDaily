import webpush, { type PushSubscription as WebPushSub } from "web-push";
import {
  getPushSubscriptions,
  deletePushSubscription,
} from "@/lib/repositories/pushRepository";
import type { NotificationKind } from "@/lib/repositories/notificationLogRepository";

/**
 * notificationService — decides whether a reminder is due and builds + sends the
 * Web Push payload. Pure decision logic is separated from the I/O so it can be
 * unit-tested without a network.
 */

let configured = false;
function ensureConfigured() {
  if (configured) return;
  const publicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
  const privateKey = process.env.VAPID_PRIVATE_KEY;
  const subject = process.env.VAPID_SUBJECT ?? "mailto:admin@example.com";
  if (!publicKey || !privateKey) {
    throw new Error("VAPID keys are not configured (run: npm run keys:vapid)");
  }
  webpush.setVapidDetails(subject, publicKey, privateKey);
  configured = true;
}

export type ReminderDecisionInput = {
  todayMet: boolean;
  nowHHmm: string; // "HH:mm" in user's local timezone
  reminderTime: string;
  lastCallEnabled: boolean;
  lastCallTime: string;
  alreadySentReminder: boolean;
  alreadySentLastCall: boolean;
};

/**
 * Returns the kind of reminder to send right now, or null. Notifications are
 * suppressed entirely once today's threshold is met — we nudge BEFORE the day
 * is lost, never after it's already satisfied.
 */
export function decideReminder(
  input: ReminderDecisionInput,
): NotificationKind | null {
  if (input.todayMet) return null;

  const past = (t: string) => input.nowHHmm >= t;

  if (past(input.reminderTime) && !input.alreadySentReminder) {
    return "reminder";
  }
  if (
    input.lastCallEnabled &&
    past(input.lastCallTime) &&
    !input.alreadySentLastCall
  ) {
    return "last_call";
  }
  return null;
}

export type PushPayload = {
  title: string;
  body: string;
  url: string;
  tag?: string;
};

export function buildReminderPayload(
  kind: NotificationKind,
  ctx: { currentStreak: number; todayCount: number; threshold: number; pace: number },
): PushPayload {
  const need = Math.max(0, ctx.threshold - ctx.todayCount);
  if (kind === "last_call") {
    return {
      title: "Last call — keep your streak alive",
      body:
        ctx.currentStreak > 0
          ? `Your ${ctx.currentStreak}-day streak ends at midnight. ${need} more contribution${need === 1 ? "" : "s"} to go.`
          : `Squeeze in ${need} contribution${need === 1 ? "" : "s"} before midnight to start a streak.`,
      url: "/",
      tag: "commitdaily-last-call",
    };
  }
  return {
    title: "Time to commit",
    body:
      ctx.currentStreak > 0
        ? `Don't break your ${ctx.currentStreak}-day streak — ${need} to go today (pace: ${ctx.pace}/day).`
        : `Get on the board today: ${need} contribution${need === 1 ? "" : "s"} keeps you on pace (${ctx.pace}/day).`,
    url: "/",
    tag: "commitdaily-reminder",
  };
}

/**
 * Sends a payload to every push subscription a user has registered. Dead
 * subscriptions (404/410) are pruned. Returns how many sends succeeded.
 */
export async function sendPushToUser(
  userId: string,
  payload: PushPayload,
): Promise<{ sent: number; pruned: number }> {
  ensureConfigured();
  const subs = await getPushSubscriptions(userId);
  let sent = 0;
  let pruned = 0;

  await Promise.all(
    subs.map(async (s) => {
      const subscription: WebPushSub = {
        endpoint: s.endpoint,
        keys: { p256dh: s.p256dh, auth: s.auth },
      };
      try {
        await webpush.sendNotification(subscription, JSON.stringify(payload));
        sent += 1;
      } catch (err: unknown) {
        const status = (err as { statusCode?: number }).statusCode;
        if (status === 404 || status === 410) {
          await deletePushSubscription(s.endpoint);
          pruned += 1;
        }
      }
    }),
  );

  return { sent, pruned };
}
