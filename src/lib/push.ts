import { subscribePush, unsubscribePush } from "@/lib/api";

export type PushCapability =
  | "ready" // supported and usable now
  | "ios-needs-install" // iOS Safari but not installed to home screen
  | "unsupported"; // browser has no push support

function isIos(): boolean {
  return /iphone|ipad|ipod/i.test(navigator.userAgent);
}

export function isStandalone(): boolean {
  return (
    window.matchMedia?.("(display-mode: standalone)").matches ||
    // iOS-specific flag
    (navigator as unknown as { standalone?: boolean }).standalone === true
  );
}

/**
 * Web Push capability check. The key constraint: iOS Safari only delivers Web
 * Push to PWAs that have been added to the home screen, on iOS 16.4+. So on iOS
 * we report "ios-needs-install" until the app is running standalone.
 */
export function getPushCapability(): PushCapability {
  if (
    typeof window === "undefined" ||
    !("serviceWorker" in navigator) ||
    !("PushManager" in window) ||
    !("Notification" in window)
  ) {
    if (typeof navigator !== "undefined" && isIos() && !isStandalone()) {
      return "ios-needs-install";
    }
    return "unsupported";
  }
  if (isIos() && !isStandalone()) {
    return "ios-needs-install";
  }
  return "ready";
}

function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const raw = atob(base64);
  const output = new Uint8Array(raw.length);
  for (let i = 0; i < raw.length; i++) output[i] = raw.charCodeAt(i);
  return output;
}

export async function getExistingSubscription(): Promise<PushSubscription | null> {
  const reg = await navigator.serviceWorker.ready;
  return reg.pushManager.getSubscription();
}

export async function enablePush(): Promise<void> {
  const vapid = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
  if (!vapid) throw new Error("VAPID public key is not configured");

  const permission = await Notification.requestPermission();
  if (permission !== "granted") {
    throw new Error("Notification permission was not granted");
  }

  const reg = await navigator.serviceWorker.ready;
  let sub = await reg.pushManager.getSubscription();
  if (!sub) {
    sub = await reg.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: urlBase64ToUint8Array(vapid) as BufferSource,
    });
  }

  await subscribePush(sub.toJSON() as PushSubscriptionJSON, navigator.userAgent);
}

export async function disablePush(): Promise<void> {
  const reg = await navigator.serviceWorker.ready;
  const sub = await reg.pushManager.getSubscription();
  if (sub) {
    await unsubscribePush(sub.endpoint);
    await sub.unsubscribe();
  }
}
