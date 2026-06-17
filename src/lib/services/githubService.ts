import { graphql } from "@octokit/graphql";
import type { DayCount } from "@/lib/repositories/contributionRepository";

/**
 * githubService — everything that talks to the GitHub GraphQL API and turns it
 * into plain daily contribution counts. No DB access, no streak math.
 *
 * We use `contributionsCollection.contributionCalendar`, which already
 * aggregates the four contribution types the spec cares about — commits,
 * pull requests, reviews and issues — into one per-day count, matching the
 * green squares on the GitHub profile.
 *
 * Rate limit: the calendar is a single GraphQL request covering up to a full
 * year, so a refresh costs ~1 of the 5000 req/hr budget. We never poll in a
 * loop.
 *
 * Private contributions: only included when the user has enabled
 * "Include private contributions on my profile" in GitHub settings. The OAuth
 * scope alone is not enough; this is surfaced in the UI.
 */

const CONTRIBUTIONS_QUERY = /* GraphQL */ `
  query ($login: String!, $from: DateTime!, $to: DateTime!) {
    user(login: $login) {
      contributionsCollection(from: $from, to: $to) {
        contributionCalendar {
          totalContributions
          weeks {
            contributionDays {
              date
              contributionCount
            }
          }
        }
      }
    }
  }
`;

type ContributionsResponse = {
  user: {
    contributionsCollection: {
      contributionCalendar: {
        totalContributions: number;
        weeks: Array<{
          contributionDays: Array<{ date: string; contributionCount: number }>;
        }>;
      };
    } | null;
  } | null;
};

export type ContributionFetch = {
  days: DayCount[];
  totalContributions: number;
};

export function makeGraphqlClient(token: string) {
  return graphql.defaults({
    headers: { authorization: `token ${token}` },
  });
}

/** Resolve the authenticated user's login from their token. */
export async function fetchViewerLogin(token: string): Promise<string> {
  const client = makeGraphqlClient(token);
  const res = await client<{ viewer: { login: string } }>(
    `query { viewer { login } }`,
  );
  return res.viewer.login;
}

/**
 * Fetch the per-day contribution counts between two instants (inclusive of the
 * calendar days they fall in). `fromISO`/`toISO` are ISO-8601 DateTimes.
 *
 * The returned `date` values are GitHub's calendar day labels. The streak
 * engine reconciles "is today complete?" against the user's local midnight;
 * see streakService.
 */
export async function fetchContributions(
  token: string,
  login: string,
  fromISO: string,
  toISO: string,
): Promise<ContributionFetch> {
  const client = makeGraphqlClient(token);
  const res = await client<ContributionsResponse>(CONTRIBUTIONS_QUERY, {
    login,
    from: fromISO,
    to: toISO,
  });

  const calendar = res.user?.contributionsCollection?.contributionCalendar;
  if (!calendar) {
    return { days: [], totalContributions: 0 };
  }

  const days: DayCount[] = [];
  for (const week of calendar.weeks) {
    for (const day of week.contributionDays) {
      days.push({ date: day.date, count: day.contributionCount });
    }
  }

  return { days, totalContributions: calendar.totalContributions };
}
