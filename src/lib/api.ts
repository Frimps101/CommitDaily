import type { DashboardDTO, SettingsDTO } from "@/lib/types";

async function jsonOrThrow<T>(res: Response): Promise<T> {
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error((body as { error?: string }).error ?? `Request failed (${res.status})`);
  }
  return res.json() as Promise<T>;
}

export async function fetchDashboard(): Promise<DashboardDTO> {
  return jsonOrThrow<DashboardDTO>(await fetch("/api/dashboard", { cache: "no-store" }));
}

export async function syncDashboard(): Promise<DashboardDTO> {
  return jsonOrThrow<DashboardDTO>(await fetch("/api/sync", { method: "POST" }));
}

export async function fetchSettings(): Promise<SettingsDTO> {
  return jsonOrThrow<SettingsDTO>(await fetch("/api/settings", { cache: "no-store" }));
}

export async function updateSettings(
  patch: Partial<SettingsDTO>,
): Promise<SettingsDTO> {
  return jsonOrThrow<SettingsDTO>(
    await fetch("/api/settings", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(patch),
    }),
  );
}

export async function sendTestPush(): Promise<{ sent: number; pruned: number }> {
  return jsonOrThrow(await fetch("/api/push/test", { method: "POST" }));
}

export async function subscribePush(sub: PushSubscriptionJSON, userAgent: string) {
  return jsonOrThrow(
    await fetch("/api/push/subscribe", {
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
    await fetch("/api/push/unsubscribe", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ endpoint }),
    }),
  );
}
