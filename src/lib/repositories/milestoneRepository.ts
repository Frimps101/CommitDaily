import { prisma } from "@/lib/db";

export async function getAwardedThresholds(userId: string): Promise<number[]> {
  const rows = await prisma.milestoneAward.findMany({
    where: { userId },
    select: { threshold: true },
  });
  return rows.map((r) => r.threshold);
}

/**
 * Records a milestone award if not already present. Returns true when this call
 * created the award (i.e. it's newly reached and should be celebrated).
 */
export async function awardMilestone(
  userId: string,
  threshold: number,
): Promise<boolean> {
  try {
    await prisma.milestoneAward.create({ data: { userId, threshold } });
    return true;
  } catch {
    // Unique constraint => already awarded.
    return false;
  }
}
