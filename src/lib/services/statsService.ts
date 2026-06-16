import { daysRemainingInclusive, endOfYearLocal, type LocalDate } from "@/lib/date";

export const MILESTONES = [100, 250, 500, 750, 1000] as const;

export type Progress = {
  goalTotal: number;
  total: number;
  remaining: number;
  daysRemaining: number;
  /** Contributions per remaining day needed to hit the goal. Recalculated live. */
  pace: number;
  /** Percent of goal reached, 0..100. */
  percent: number;
  deadline: LocalDate;
  /** Highest milestone reached so far (or null). */
  lastMilestone: number | null;
  /** Next milestone not yet reached (or null if all reached). */
  nextMilestone: number | null;
};

/**
 * Live pace: (goal − contributions so far) ÷ days remaining until the deadline.
 * Recalculated on every load. `daysRemaining` is inclusive of today and floored
 * at 1 so the figure stays meaningful on Dec 31 itself.
 */
export function computeProgress(
  total: number,
  goalTotal: number,
  timezone: string,
  deadline?: LocalDate,
  now: Date = new Date(),
): Progress {
  const dl = deadline ?? endOfYearLocal(timezone, now);
  const daysRemaining = daysRemainingInclusive(dl, timezone, now);
  const remaining = Math.max(0, goalTotal - total);
  const pace = remaining === 0 ? 0 : remaining / daysRemaining;
  const percent = goalTotal > 0 ? Math.min(100, (total / goalTotal) * 100) : 0;

  let lastMilestone: number | null = null;
  let nextMilestone: number | null = null;
  for (const m of MILESTONES) {
    if (total >= m) lastMilestone = m;
    else if (nextMilestone === null) nextMilestone = m;
  }

  return {
    goalTotal,
    total,
    remaining,
    daysRemaining,
    pace: Math.round(pace * 100) / 100,
    percent: Math.round(percent * 10) / 10,
    deadline: dl,
    lastMilestone,
    nextMilestone,
  };
}

/** Milestones newly crossed when going from `previousTotal` to `total`. */
export function newlyReachedMilestones(
  previousTotal: number,
  total: number,
): number[] {
  return MILESTONES.filter((m) => previousTotal < m && total >= m);
}
