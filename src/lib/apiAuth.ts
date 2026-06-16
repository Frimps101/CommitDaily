import { auth } from "@/auth";
import { NextResponse } from "next/server";

export type AuthedUser = { id: string };

/**
 * Resolves the signed-in user for an API route, or returns a 401 Response.
 * Usage: const user = await requireUser(); if (user instanceof NextResponse) return user;
 */
export async function requireUser(): Promise<AuthedUser | NextResponse> {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  return { id: session.user.id };
}
