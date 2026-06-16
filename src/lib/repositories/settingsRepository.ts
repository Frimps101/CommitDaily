import { prisma } from "@/lib/db";
import type { Settings } from "@prisma/client";

export async function getSettings(userId: string): Promise<Settings | null> {
  return prisma.settings.findUnique({ where: { userId } });
}

/** Returns existing settings, creating a default row on first access. */
export async function getOrCreateSettings(userId: string): Promise<Settings> {
  const existing = await prisma.settings.findUnique({ where: { userId } });
  if (existing) return existing;
  return prisma.settings.create({ data: { userId } });
}

export type SettingsUpdate = Partial<
  Pick<
    Settings,
    | "timezone"
    | "dailyThreshold"
    | "freezeEnabled"
    | "reminderTime"
    | "lastCallEnabled"
    | "lastCallTime"
    | "goalTotal"
  >
>;

export async function updateSettings(
  userId: string,
  data: SettingsUpdate,
): Promise<Settings> {
  return prisma.settings.upsert({
    where: { userId },
    create: { userId, ...data },
    update: data,
  });
}
