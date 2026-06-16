import {
  getGithubAccessToken,
  getGithubLogin,
  setGithubLogin,
} from "@/lib/repositories/userRepository";
import { getOrCreateSettings } from "@/lib/repositories/settingsRepository";
import {
  upsertDailyCounts,
  getDailyCounts,
  getTotalContributions,
} from "@/lib/repositories/contributionRepository";
import { saveStreakState } from "@/lib/repositories/streakRepository";
import { awardMilestone } from "@/lib/repositories/milestoneRepository";
import {
  fetchContributions,
  fetchViewerLogin,
} from "@/lib/services/githubService";
import { computeStreak, type StreakResult } from "@/lib/services/streakService";
import {
  computeProgress,
  MILESTONES,
  type Progress,
} from "@/lib/services/statsService";
import { startOfYearLocal } from "@/lib/date";

export type SyncResult = {
  streak: StreakResult;
  progress: Progress;
  newMilestones: number[];
};

/**
 * Pull fresh contribution data from GitHub, persist it, recompute streak +
 * progress, and record any newly-reached milestones. This is the one place that
 * composes githubService, streakService and statsService with the repositories.
 *
 * Kept deliberately simple: one GraphQL call per sync, no queue, no Redis.
 */
export async function syncUserContributions(userId: string): Promise<SyncResult> {
  const token = await getGithubAccessToken(userId);
  if (!token) {
    throw new Error("No GitHub access token on file for user");
  }

  let login = await getGithubLogin(userId);
  if (!login) {
    login = await fetchViewerLogin(token);
    await setGithubLogin(userId, login);
  }

  const settings = await getOrCreateSettings(userId);

  const yearStart = startOfYearLocal(settings.timezone);
  const fromISO = `${yearStart}T00:00:00.000Z`;
  const toISO = new Date().toISOString();

  const { days } = await fetchContributions(token, login, fromISO, toISO);
  await upsertDailyCounts(userId, days);

  return computeFromStore(userId);
}

/**
 * Recompute streak + progress from already-stored data (no GitHub call). Used
 * by read endpoints so the dashboard works offline / cheaply.
 */
export async function computeFromStore(userId: string): Promise<SyncResult> {
  const settings = await getOrCreateSettings(userId);
  const yearStart = startOfYearLocal(settings.timezone);

  const stored = await getDailyCounts(userId, yearStart);
  const days = stored.map((d) => ({ date: d.date, count: d.count }));
  const total = await getTotalContributions(userId, yearStart);

  const streak = computeStreak(days, {
    dailyThreshold: settings.dailyThreshold,
    freezeEnabled: settings.freezeEnabled,
    timezone: settings.timezone,
  });

  const progress = computeProgress(total, settings.goalTotal, settings.timezone);

  // Award any milestone at or below the current total; collect the new ones.
  const newMilestones: number[] = [];
  for (const m of MILESTONES) {
    if (total >= m) {
      const created = await awardMilestone(userId, m);
      if (created) newMilestones.push(m);
    }
  }

  await saveStreakState(userId, {
    currentStreak: streak.currentStreak,
    longestStreak: streak.longestStreak,
    lastCountedDate: streak.lastCountedDate,
    freezeUsed: streak.freezeUsed,
  });

  return { streak, progress, newMilestones };
}
