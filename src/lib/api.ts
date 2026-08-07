import type { DashboardDTO, SettingsDTO } from "@/lib/types";

const DEFAULT_TIMEOUT_MS = 20_000;

/**
 * fetch with a hard timeout. Without this, a hung backend (e.g. the DB is
 * unreachable and Prisma blocks) leaves the request pending forever, which in
 * turn leaves a mutation's `isPending` stuck true — a spinner that never stops.
 */
async function fetchWithTimeout(
  input: RequestInfo,
  init: RequestInit = {},
  timeoutMs = DEFAULT_TIMEOUT_MS,
): Promise<Response> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    return await fetch(input, { ...init, signal: controller.signal });
  } catch (err) {
    if (err instanceof DOMException && err.name === "AbortError") {
      throw new Error("Request timed out. Check your connection and try again.");
    }
    throw err;
  } finally {
    clearTimeout(timer);
  }
}

async function jsonOrThrow<T>(res: Response): Promise<T> {
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error((body as { error?: string }).error ?? `Request failed (${res.status})`);
  }
  return res.json() as Promise<T>;
}

export async function fetchDashboard(): Promise<DashboardDTO> {
  return jsonOrThrow<DashboardDTO>(
    await fetchWithTimeout("/api/dashboard", { cache: "no-store" }),
  );
}

export async function syncDashboard(): Promise<DashboardDTO> {
  return jsonOrThrow<DashboardDTO>(
    await fetchWithTimeout("/api/sync", { method: "POST" }),
  );
}

export async function fetchSettings(): Promise<SettingsDTO> {
  return jsonOrThrow<SettingsDTO>(
    await fetchWithTimeout("/api/settings", { cache: "no-store" }),
  );
}

export async function updateSettings(
  patch: Partial<SettingsDTO>,
): Promise<SettingsDTO> {
  return jsonOrThrow<SettingsDTO>(
    await fetchWithTimeout("/api/settings", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(patch),
    }),
  );
}

export async function sendTestPush(): Promise<{ sent: number; pruned: number }> {
  return jsonOrThrow(await fetchWithTimeout("/api/push/test", { method: "POST" }));
}

export async function subscribePush(sub: PushSubscriptionJSON, userAgent: string) {
  return jsonOrThrow(
    await fetchWithTimeout("/api/push/subscribe", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        endpoint: sub.endpoint,
        keys: sub.keys,
        userAgent,
      }),
    }),
  );
}

export async function unsubscribePush(endpoint: string) {
  return jsonOrThrow(
    await fetchWithTimeout("/api/push/unsubscribe", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ endpoint }),
    }),
  );
}
