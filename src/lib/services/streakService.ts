import { previousDay, todayLocal, type LocalDate } from "@/lib/date";
import type { DayCount } from "@/lib/repositories/contributionRepository";

/**
 * streakService — pure streak/freeze/reset math. No I/O.
 *
 * Reset rule (stated plainly so the UI can show it to the user):
 *
 *   • A day "counts" when its contribution count >= `dailyThreshold`.
 *   • Your current streak is the run of consecutive counted days ending today
 *     (or ending yesterday while today is still in progress).
 *   • The streak resets to 0 only once a full local day has gone by with no
 *     qualifying contribution — measured against YOUR local midnight, not UTC.
 *   • Freeze (optional): one missed day in the run is forgiven. The freeze is
 *     spent automatically the first time a single-day gap would otherwise break
 *     the streak, and it refreshes when a brand-new streak begins.
 */

export type StreakOptions = {
  dailyThreshold: number;
  freezeEnabled: boolean;
  timezone: string;
};

export type StreakResult = {
  currentStreak: number;
  longestStreak: number;
  freezeUsed: boolean;
  lastCountedDate: LocalDate | null;
  todayDate: LocalDate;
  todayCount: number;
  todayMet: boolean;
  /** "safe": today already met. "at_risk": alive but today not met. "broken": no active streak. */
  status: "safe" | "at_risk" | "broken";
};

function buildCountedSet(
  days: DayCount[],
  threshold: number,
): { counted: Set<string>; countByDate: Map<string, number> } {
  const counted = new Set<string>();
  const countByDate = new Map<string, number>();
  for (const d of days) {
    countByDate.set(d.date, d.count);
    if (d.count >= threshold) counted.add(d.date);
  }
  return { counted, countByDate };
}

/** Longest run of strictly-consecutive counted days (freeze not applied). */
function computeLongestConsecutive(counted: Set<string>): number {
  const sorted = Array.from(counted).sort();
  let longest = 0;
  let run = 0;
  let prev: LocalDate | null = null;
  for (const date of sorted) {
    if (prev !== null && previousDay(date) === prev) {
      run += 1;
    } else {
      run = 1;
    }
    prev = date;
    if (run > longest) longest = run;
  }
  return longest;
}

/**
 * Walk backwards counting consecutive counted days, allowing at most one
 * forgiven single-day gap when `freezeAvailable` is true.
 */
function walkBack(
  start: LocalDate,
  counted: Set<string>,
  freezeAvailable: boolean,
): { length: number; freezeUsed: boolean } {
  let length = 0;
  let cursor = start;
  let canFreeze = freezeAvailable;
  let freezeUsed = false;

  // Hard cap to avoid runaway loops on bad data.
  for (let i = 0; i < 366 * 6; i++) {
    if (counted.has(cursor)) {
      length += 1;
      cursor = previousDay(cursor);
      continue;
    }
    if (canFreeze) {
      canFreeze = false;
      freezeUsed = true;
      cursor = previousDay(cursor); // forgive this one missed day, don't count it
      continue;
    }
    break;
  }
  return { length, freezeUsed };
}

export function computeStreak(
  days: DayCount[],
  opts: StreakOptions,
  now: Date = new Date(),
): StreakResult {
  const { counted, countByDate } = buildCountedSet(days, opts.dailyThreshold);
  const todayDate = todayLocal(opts.timezone, now);
  const yesterday = previousDay(todayDate);
  const todayCount = countByDate.get(todayDate) ?? 0;
  const todayMet = todayCount >= opts.dailyThreshold;

  const longestConsecutive = computeLongestConsecutive(counted);

  let current = 0;
  let freezeUsed = false;

  if (counted.has(todayDate)) {
    // Today done: run ends today, freeze still available for earlier gaps.
    const r = walkBack(todayDate, counted, opts.freezeEnabled);
    current = r.length;
    freezeUsed = r.freezeUsed;
  } else if (counted.has(yesterday)) {
    // Today in progress; the live run ends yesterday.
    const r = walkBack(yesterday, counted, opts.freezeEnabled);
    current = r.length;
    freezeUsed = r.freezeUsed;
  } else if (opts.freezeEnabled && counted.has(previousDay(yesterday))) {
    // Yesterday fully missed and today not yet done: spend the freeze to keep
    // the run that ended two days ago alive.
    const r = walkBack(previousDay(yesterday), counted, false);
    current = r.length;
    freezeUsed = true;
  } else {
    current = 0;
    freezeUsed = false;
  }

  // Find the most recent counted date at or before today (for display).
  let lastCountedDate: LocalDate | null = null;
  for (const d of counted) {
    if (d <= todayDate && (lastCountedDate === null || d > lastCountedDate)) {
      lastCountedDate = d;
    }
  }

  const longestStreak = Math.max(longestConsecutive, current);

  const status: StreakResult["status"] =
    todayMet ? "safe" : current > 0 ? "at_risk" : "broken";

  return {
    currentStreak: current,
    longestStreak,
    freezeUsed,
    lastCountedDate,
    todayDate,
    todayCount,
    todayMet,
    status,
  };
}
