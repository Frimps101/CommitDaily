import { getOrCreateSettings } from "@/lib/repositories/settingsRepository";
import { getDailyCounts } from "@/lib/repositories/contributionRepository";
import { getAwardedThresholds } from "@/lib/repositories/milestoneRepository";
import { computeFromStore } from "@/lib/services/syncService";
import { MILESTONES } from "@/lib/services/statsService";
import { startOfYearLocal, type LocalDate } from "@/lib/date";

/** Client-safe settings shape (no ids/timestamps). */
export type PublicSettings = {
  timezone: string;
  dailyThreshold: number;
  freezeEnabled: boolean;
  reminderTime: string;
  lastCallEnabled: boolean;
  lastCallTime: string;
  goalTotal: number;
};

export type DashboardPayload = {
  streak: Awaited<ReturnType<typeof computeFromStore>>["streak"];
  progress: Awaited<ReturnType<typeof computeFromStore>>["progress"];
  newMilestones: number[];
  settings: PublicSettings;
  heatmap: Array<{ date: LocalDate; count: number }>;
  milestones: { all: number[]; awarded: number[] };
};

/**
 * Composes the full read model for the dashboard from stored data. Does NOT
 * call GitHub — that's `syncUserContributions`. Safe to serve offline.
 */
export async function getDashboard(userId: string): Promise<DashboardPayload> {
  const { streak, progress, newMilestones } = await computeFromStore(userId);
  const settings = await getOrCreateSettings(userId);
  const yearStart = startOfYearLocal(settings.timezone);
  const stored = await getDailyCounts(userId, yearStart);
  const awarded = await getAwardedThresholds(userId);

  return {
    streak,
    progress,
    newMilestones,
    settings: {
      timezone: settings.timezone,
      dailyThreshold: settings.dailyThreshold,
      freezeEnabled: settings.freezeEnabled,
      reminderTime: settings.reminderTime,
      lastCallEnabled: settings.lastCallEnabled,
      lastCallTime: settings.lastCallTime,
      goalTotal: settings.goalTotal,
    },
    heatmap: stored.map((d) => ({ date: d.date, count: d.count })),
    milestones: { all: [...MILESTONES], awarded },
  };
}
