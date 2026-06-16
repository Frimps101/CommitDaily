import { prisma } from "@/lib/db";
import { decryptToken, isProbablyEncrypted } from "@/lib/crypto";

/**
 * Returns the decrypted GitHub access token for a user, or null. This is the
 * ONLY path by which a token leaves the database, and it stays server-side.
 */
export async function getGithubAccessToken(userId: string): Promise<string | null> {
  const account = await prisma.account.findFirst({
    where: { userId, provider: "github" },
    select: { access_token: true },
  });
  if (!account?.access_token) return null;
  return isProbablyEncrypted(account.access_token)
    ? decryptToken(account.access_token)
    : account.access_token;
}

export async function getGithubLogin(userId: string): Promise<string | null> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { githubLogin: true },
  });
  return user?.githubLogin ?? null;
}

export async function setGithubLogin(userId: string, login: string): Promise<void> {
  await prisma.user.update({ where: { id: userId }, data: { githubLogin: login } });
}

/** All users that have at least one push subscription — the cron work set. */
export async function listUsersWithSubscriptions() {
  return prisma.user.findMany({
    where: { pushSubscriptions: { some: {} } },
    select: { id: true, githubLogin: true },
  });
}
