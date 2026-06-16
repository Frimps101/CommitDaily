import NextAuth from "next-auth";
import GitHub from "next-auth/providers/github";
import { PrismaAdapter } from "@auth/prisma-adapter";
import type { Adapter, AdapterAccount } from "next-auth/adapters";
import { prisma } from "@/lib/db";
import { encryptToken } from "@/lib/crypto";

/**
 * Auth.js (NextAuth v5) with the GitHub provider and a database session.
 *
 * Token-at-rest encryption: we wrap the Prisma adapter's `linkAccount` so the
 * OAuth access/refresh tokens are AES-256-GCM encrypted before they ever hit
 * the database. They are decrypted only inside server-side services
 * (see userRepository.getGithubAccessToken) and never sent to the client.
 *
 * Scope: `read:user` is enough to read the contribution calendar. Private-repo
 * contributions appear only if the user enabled "Include private contributions
 * on my profile" in GitHub settings — surfaced in the UI, not requestable here.
 */
function encryptingAdapter(): Adapter {
  const base = PrismaAdapter(prisma);
  return {
    ...base,
    linkAccount: (account: AdapterAccount) => {
      const enc: AdapterAccount = {
        ...account,
        access_token: account.access_token
          ? encryptToken(account.access_token)
          : account.access_token,
        refresh_token: account.refresh_token
          ? encryptToken(account.refresh_token)
          : account.refresh_token,
      };
      return base.linkAccount!(enc);
    },
  };
}

export const { handlers, auth, signIn, signOut } = NextAuth({
  adapter: encryptingAdapter(),
  trustHost: true,
  session: { strategy: "database" },
  providers: [
    GitHub({
      authorization: { params: { scope: "read:user user:email" } },
    }),
  ],
  pages: {
    signIn: "/",
  },
  callbacks: {
    session({ session, user }) {
      if (session.user) session.user.id = user.id;
      return session;
    },
  },
});
