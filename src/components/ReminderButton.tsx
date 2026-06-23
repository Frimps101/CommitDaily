"use client";

import { useEffect, useState } from "react";
import { Bell, BellOff, BellRing, Share, Smartphone } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  disablePush,
  enablePush,
  getExistingSubscription,
  getPushCapability,
  type PushCapability,
} from "@/lib/push";
import { sendTestPush } from "@/lib/api";

/**
 * Compact navbar reminders control: a bell icon that opens a small dialog with
 * enable/disable/test, plus the explicit iOS-install guidance. Replaces the
 * large dashboard card.
 */
export function ReminderButton() {
  const [open, setOpen] = useState(false);
  const [capability, setCapability] = useState<PushCapability | null>(null);
  const [subscribed, setSubscribed] = useState(false);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    const cap = getPushCapability();
    setCapability(cap);
    if (cap === "ready") {
      getExistingSubscription()
        .then((s) => setSubscribed(Boolean(s)))
        .catch(() => setSubscribed(false));
    }
  }, []);

  async function handleEnable() {
    setBusy(true);
    setMessage(null);
    try {
      await enablePush();
      setSubscribed(true);
      setMessage("Reminders on. We'll nudge you before the day is lost.");
    } catch (err) {
      setMessage(err instanceof Error ? err.message : "Could not enable notifications");
    } finally {
      setBusy(false);
    }
  }

  async function handleDisable() {
    setBusy(true);
    setMessage(null);
    try {
      await disablePush();
      setSubscribed(false);
      setMessage("Reminders off.");
    } catch (err) {
      setMessage(err instanceof Error ? err.message : "Could not disable notifications");
    } finally {
      setBusy(false);
    }
  }

  async function handleTest() {
    setBusy(true);
    setMessage(null);
    try {
      const res = await sendTestPush();
      setMessage(
        res.sent > 0
          ? `Test sent to ${res.sent} device${res.sent === 1 ? "" : "s"}.`
          : "No devices received it — check that reminders are enabled on this device.",
      );
    } catch (err) {
      setMessage(err instanceof Error ? err.message : "Test push failed");
    } finally {
      setBusy(false);
    }
  }

  return (
    <>
      <Button
        variant="ghost"
        size="icon"
        onClick={() => setOpen(true)}
        title="Reminders"
        className="relative"
      >
        {subscribed ? <BellRing className="h-4 w-4 text-primary" /> : <Bell className="h-4 w-4" />}
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reminders</DialogTitle>
            <DialogDescription>
              A server-side nudge before you lose a day — sent only if today&apos;s
              threshold isn&apos;t met yet.
            </DialogDescription>
          </DialogHeader>

          {capability === "ios-needs-install" ? (
            <div className="rounded-lg border border-amber-500/30 bg-amber-500/10 p-3 text-sm">
              <div className="flex items-center gap-2 font-medium text-amber-300">
                <Smartphone className="h-4 w-4" /> Install to enable iOS push
              </div>
              <p className="mt-1 text-muted-foreground">
                On iPhone/iPad, Web Push only works for an installed PWA on iOS
                16.4+. Tap <Share className="inline h-3.5 w-3.5" /> Share →{" "}
                <span className="font-medium">Add to Home Screen</span>, then open
                CommitDaily from the home screen and enable reminders here.
              </p>
            </div>
          ) : capability === "unsupported" ? (
            <p className="text-sm text-muted-foreground">
              This browser doesn&apos;t support Web Push. Try Chrome/Edge on
              desktop or an installed PWA on Android / iOS 16.4+.
            </p>
          ) : (
            <div className="flex flex-wrap gap-2">
              {subscribed ? (
                <>
                  <Button variant="outline" onClick={handleDisable} disabled={busy}>
                    <BellOff className="h-4 w-4" /> Turn off
                  </Button>
                  <Button variant="secondary" onClick={handleTest} disabled={busy}>
                    Send test push
                  </Button>
                </>
              ) : (
                <Button onClick={handleEnable} disabled={busy}>
                  <Bell className="h-4 w-4" /> Enable reminders
                </Button>
              )}
            </div>
          )}

          {message ? (
            <p className="text-xs text-muted-foreground">{message}</p>
          ) : null}
        </DialogContent>
      </Dialog>
    </>
  );
}
