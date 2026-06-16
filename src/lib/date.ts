import { formatInTimeZone } from "date-fns-tz";

/**
 * Local-midnight vs UTC handling lives here, on purpose.
 *
 * GitHub's contribution graph buckets contributions by UTC day. A user in,
 * say, UTC-8 who commits at 11pm local on Jan 5 lands in GitHub's Jan 6 bucket.
 * If we anchored the streak to UTC we'd tell them they missed Jan 5. So the
 * streak boundary is anchored to the user's *local* midnight: every date we
 * reason about is a "yyyy-MM-dd" string computed in the user's IANA timezone.
 *
 * githubService reconciles the UTC-bucketed GitHub data into these local-day
 * buckets before any streak math runs (see githubService.ts).
 */

export type LocalDate = string; // "yyyy-MM-dd"

/** The local calendar date (in `timezone`) for an absolute instant. */
export function toLocalDate(instant: Date, timezone: string): LocalDate {
  return formatInTimeZone(instant, timezone, "yyyy-MM-dd");
}

/** Today's local date in the given timezone. */
export function todayLocal(timezone: string, now: Date = new Date()): LocalDate {
  return toLocalDate(now, timezone);
}

/**
 * Treat a "yyyy-MM-dd" as UTC noon. Noon (not midnight) keeps the date stable
 * under +/- 14h timezone shifts and DST, since we only ever read back the
 * y/m/d components.
 */
function parseLocalDate(date: LocalDate): Date {
  const [y, m, d] = date.split("-").map(Number);
  return new Date(Date.UTC(y, m - 1, d, 12, 0, 0));
}

function formatLocalDate(d: Date): LocalDate {
  const y = d.getUTCFullYear();
  const m = String(d.getUTCMonth() + 1).padStart(2, "0");
  const day = String(d.getUTCDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

export function addDays(date: LocalDate, days: number): LocalDate {
  const d = parseLocalDate(date);
  d.setUTCDate(d.getUTCDate() + days);
  return formatLocalDate(d);
}

export function previousDay(date: LocalDate): LocalDate {
  return addDays(date, -1);
}

export function nextDay(date: LocalDate): LocalDate {
  return addDays(date, 1);
}

/** Whole-day difference a - b (positive when a is after b). */
export function diffDays(a: LocalDate, b: LocalDate): number {
  const msPerDay = 86_400_000;
  return Math.round((parseLocalDate(a).getTime() - parseLocalDate(b).getTime()) / msPerDay);
}

export function isSameOrBefore(a: LocalDate, b: LocalDate): boolean {
  return diffDays(a, b) <= 0;
}

/**
 * Inclusive count of days from `today` through `deadline` in local time.
 * Used for the pace calculation. Floored at 1 so pace never divides by zero
 * (on/after the deadline the "remaining days" is treated as the final day).
 */
export function daysRemainingInclusive(
  deadline: LocalDate,
  timezone: string,
  now: Date = new Date(),
): number {
  const today = todayLocal(timezone, now);
  const d = diffDays(deadline, today) + 1;
  return Math.max(1, d);
}

/** Build the inclusive list of "yyyy-MM-dd" between two local dates. */
export function dateRange(from: LocalDate, to: LocalDate): LocalDate[] {
  const out: LocalDate[] = [];
  let cur = from;
  // guard against runaway loops
  for (let i = 0; i <= 366 * 5 && isSameOrBefore(cur, to); i++) {
    out.push(cur);
    cur = nextDay(cur);
  }
  return out;
}

/** First day of the current year in local time, as "yyyy-MM-dd". */
export function startOfYearLocal(timezone: string, now: Date = new Date()): LocalDate {
  const year = formatInTimeZone(now, timezone, "yyyy");
  return `${year}-01-01`;
}

/** Last day of the current year in local time, as "yyyy-MM-dd". */
export function endOfYearLocal(timezone: string, now: Date = new Date()): LocalDate {
  const year = formatInTimeZone(now, timezone, "yyyy");
  return `${year}-12-31`;
}

/** Current "HH:mm" in the user's timezone, for comparing against reminder times. */
export function localTimeHHmm(timezone: string, now: Date = new Date()): string {
  return formatInTimeZone(now, timezone, "HH:mm");
}
