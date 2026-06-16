import { prisma } from "@/lib/db";

export type NotificationKind = "reminder" | "last_call";

export async function hasSent(
  userId: string,
  date: string,
  kind: NotificationKind,
): Promise<boolean> {
  const row = await prisma.notificationLog.findUnique({
    where: { userId_date_kind: { userId, date, kind } },
  });
  return Boolean(row);
}

/**
 * Marks a notification as sent. Returns false if a row already existed, which
 * makes the cron heartbeat idempotent under retries / overlapping runs.
 */
export async function markSent(
  userId: string,
  date: string,
  kind: NotificationKind,
): Promise<boolean> {
  try {
    await prisma.notificationLog.create({ data: { userId, date, kind } });
    return true;
  } catch {
    return false;
  }
}
