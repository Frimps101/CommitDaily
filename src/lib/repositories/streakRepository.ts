import { prisma } from "@/lib/db";
import type { StreakState } from "@prisma/client";

export async function getStreakState(userId: string): Promise<StreakState | null> {
  return prisma.streakState.findUnique({ where: { userId } });
}

export type StreakStateUpsert = {
  currentStreak: number;
  longestStreak: number;
  lastCountedDate: string | null;
  freezeUsed: boolean;
};

export async function saveStreakState(
  userId: string,
  state: StreakStateUpsert,
): Promise<StreakState> {
  return prisma.streakState.upsert({
    where: { userId },
    create: { userId, ...state },
    update: state,
  });
}
