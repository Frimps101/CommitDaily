import { prisma } from "@/lib/db";
import type { DailyContribution } from "@prisma/client";

export type DayCount = { date: string; count: number };

/** Upsert a batch of local-day contribution counts. */
export async function upsertDailyCounts(
  userId: string,
  days: DayCount[],
): Promise<void> {
  if (days.length === 0) return;
  await prisma.$transaction(
    days.map((d) =>
      prisma.dailyContribution.upsert({
        where: { userId_date: { userId, date: d.date } },
        create: { userId, date: d.date, count: d.count },
        update: { count: d.count },
      }),
    ),
  );
}

export async function getDailyCounts(
  userId: string,
  from?: string,
  to?: string,
): Promise<DailyContribution[]> {
  return prisma.dailyContribution.findMany({
    where: {
      userId,
      ...(from || to
        ? { date: { ...(from ? { gte: from } : {}), ...(to ? { lte: to } : {}) } }
        : {}),
    },
    orderBy: { date: "asc" },
  });
}

export async function getCountForDate(
  userId: string,
  date: string,
): Promise<number> {
  const row = await prisma.dailyContribution.findUnique({
    where: { userId_date: { userId, date } },
  });
  return row?.count ?? 0;
}

/** Sum of all contribution counts within an optional date range. */
export async function getTotalContributions(
  userId: string,
  from?: string,
  to?: string,
): Promise<number> {
  const result = await prisma.dailyContribution.aggregate({
    where: {
      userId,
      ...(from || to
        ? { date: { ...(from ? { gte: from } : {}), ...(to ? { lte: to } : {}) } }
        : {}),
    },
    _sum: { count: true },
  });
  return result._sum.count ?? 0;
}
