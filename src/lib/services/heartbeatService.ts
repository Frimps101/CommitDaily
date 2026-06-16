import { listUsersWithSubscriptions } from "@/lib/repositories/userRepository";
import { getOrCreateSettings } from "@/lib/repositories/settingsRepository";
import {
  hasSent,
  markSent,
} from "@/lib/repositories/notificationLogRepository";
import { syncUserContributions } from "@/lib/services/syncService";
import {
  decideReminder,
  buildReminderPayload,
  sendPushToUser,
} from "@/lib/services/notificationService";
import { localTimeHHmm } from "@/lib/date";

export type HeartbeatUserResult = {
  userId: string;
  decision: "reminder" | "last_call" | "none" | "error";
  detail?: string;
};

/**
 * The scheduled heartbeat: for one user, refresh data, then decide and send a
 * reminder if today's threshold is still unmet and a reminder window has passed.
 * Idempotent — the NotificationLog prevents double-sends within a local day.
 */
export async function processUserReminder(
  userId: string,
  now: Date = new Date(),
): Promise<HeartbeatUserResult> {
  try {
    const { streak, progress } = await syncUserContributions(userId);
    const settings = await getOrCreateSettings(userId);
    const today = streak.todayDate;
    const nowHHmm = localTimeHHmm(settings.timezone, now);

    const [sentReminder, sentLastCall] = await Promise.all([
      hasSent(userId, today, "reminder"),
      hasSent(userId, today, "last_call"),
    ]);

    const kind = decideReminder({
      todayMet: streak.todayMet,
      nowHHmm,
      reminderTime: settings.reminderTime,
      lastCallEnabled: settings.lastCallEnabled,
      lastCallTime: settings.lastCallTime,
      alreadySentReminder: sentReminder,
      alreadySentLastCall: sentLastCall,
    });

    if (!kind) return { userId, decision: "none" };

    // Claim the slot first so concurrent runs can't double-send.
    const claimed = await markSent(userId, today, kind);
    if (!claimed) return { userId, decision: "none", detail: "already sent" };

    const payload = buildReminderPayload(kind, {
      currentStreak: streak.currentStreak,
      todayCount: streak.todayCount,
      threshold: settings.dailyThreshold,
      pace: progress.pace,
    });
    const result = await sendPushToUser(userId, payload);

    return { userId, decision: kind, detail: `sent=${result.sent} pruned=${result.pruned}` };
  } catch (err) {
    return {
      userId,
      decision: "error",
      detail: err instanceof Error ? err.message : "unknown error",
    };
  }
}

/** Run the heartbeat for every user that has a push subscription. */
export async function runHeartbeat(now: Date = new Date()) {
  const users = await listUsersWithSubscriptions();
  const results: HeartbeatUserResult[] = [];
  for (const u of users) {
    results.push(await processUserReminder(u.id, now));
  }
  return { processed: users.length, results };
}
