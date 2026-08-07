"use client";

import { useEffect } from "react";

/**
 * In development, next-pwa is disabled and never registers (or unregisters) a
 * service worker. But a worker left over from a previous `npm run build && npm
 * start` keeps controlling the page — serving stale JS and intercepting fetches,
 * which makes reloads run old code (e.g. a spinner that never resolves).
 *
 * This unregisters any leftover worker and clears its caches once per tab, then
 * reloads a single time so the page runs the real dev bundle. It is a no-op in
 * production, where the service worker is intentional.
 */
export function DevServiceWorkerCleanup() {
  useEffect(() => {
    if (process.env.NODE_ENV !== "development") return;
    if (typeof navigator === "undefined" || !("serviceWorker" in navigator)) return;

    let cancelled = false;

    navigator.serviceWorker.getRegistrations().then(async (regs) => {
      if (cancelled || regs.length === 0) return;

      await Promise.all(regs.map((r) => r.unregister()));

      if ("caches" in window) {
        const keys = await caches.keys();
        await Promise.all(keys.map((k) => caches.delete(k)));
      }

      // Guard against a reload loop: only reload once per tab session.
      if (!sessionStorage.getItem("dev-sw-cleaned")) {
        sessionStorage.setItem("dev-sw-cleaned", "1");
        window.location.reload();
      }
    });

    return () => {
      cancelled = true;
    };
  }, []);

  return null;
}
