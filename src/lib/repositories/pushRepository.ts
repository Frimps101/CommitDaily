import { prisma } from "@/lib/db";
import type { PushSubscription } from "@prisma/client";

export type PushSubInput = {
  endpoint: string;
  p256dh: string;
  auth: string;
  userAgent?: string | null;
};

export async function savePushSubscription(
  userId: string,
  sub: PushSubInput,
): Promise<PushSubscription> {
  return prisma.pushSubscription.upsert({
    where: { endpoint: sub.endpoint },
    create: { userId, ...sub },
    update: { userId, p256dh: sub.p256dh, auth: sub.auth, userAgent: sub.userAgent },
  });
}

export async function deletePushSubscription(endpoint: string): Promise<void> {
  await prisma.pushSubscription.deleteMany({ where: { endpoint } });
}

export async function getPushSubscriptions(
  userId: string,
): Promise<PushSubscription[]> {
  return prisma.pushSubscription.findMany({ where: { userId } });
}
