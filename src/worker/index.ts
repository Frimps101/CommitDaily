/// <reference lib="webworker" />

// Custom service-worker logic, bundled into the next-pwa service worker.
// Handles Web Push display + click-through. Workbox (configured in
// next.config.mjs) layers precaching and offline read-caching around this.

declare const self: ServiceWorkerGlobalScope;

type PushPayload = {
  title: string;
  body: string;
  url?: string;
  tag?: string;
};

self.addEventListener("push", (event: PushEvent) => {
  let payload: PushPayload = { title: "CommitDaily", body: "Time to commit." };
  try {
    if (event.data) payload = { ...payload, ...(event.data.json() as PushPayload) };
  } catch {
    if (event.data) payload.body = event.data.text();
  }

  console.log("[CommitDaily SW] push received:", payload);

  event.waitUntil(
    self.registration
      .showNotification(payload.title, {
        body: payload.body,
        icon: "/icons/icon-192.png",
        badge: "/icons/badge-72.png",
        tag: payload.tag ?? "commitdaily",
        data: { url: payload.url ?? "/" },
      })
      .then(() => console.log("[CommitDaily SW] showNotification resolved"))
      .catch((err) => console.error("[CommitDaily SW] showNotification failed:", err)),
  );
});

self.addEventListener("notificationclick", (event: NotificationEvent) => {
  event.notification.close();
  const url =
    (event.notification.data as { url?: string } | undefined)?.url ?? "/";

  event.waitUntil(
    (async () => {
      const clientList = await self.clients.matchAll({
        type: "window",
        includeUncontrolled: true,
      });
      for (const client of clientList) {
        if ("focus" in client) {
          await client.focus();
          if ("navigate" in client) {
            try {
              await (client as WindowClient).navigate(url);
            } catch {
              /* navigation may be blocked cross-origin; focus is enough */
            }
          }
          return;
        }
      }
      await self.clients.openWindow(url);
    })(),
  );
});
