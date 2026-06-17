"use client";

import { useEffect, useMemo, useState } from "react";
import { Save } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { useSettings, useUpdateSettings } from "@/hooks/useSettings";
import { useSettingsDraft } from "@/store/settingsDraft";

function timezoneList(): string[] {
  try {
    const supported = (Intl as unknown as { supportedValuesOf?: (k: string) => string[] })
      .supportedValuesOf?.("timeZone");
    if (supported?.length) return supported;
  } catch {
    /* fall through */
  }
  return [
    "UTC",
    "America/New_York",
    "America/Chicago",
    "America/Denver",
    "America/Los_Angeles",
    "Europe/London",
    "Europe/Berlin",
    "Africa/Accra",
    "Asia/Kolkata",
    "Asia/Singapore",
    "Asia/Tokyo",
    "Australia/Sydney",
  ];
}

export function SettingsForm() {
  const { data, isLoading } = useSettings();
  const update = useUpdateSettings();
  const { draft, setDraft, patch, clear } = useSettingsDraft();
  const [saved, setSaved] = useState(false);
  const zones = useMemo(timezoneList, []);

  useEffect(() => {
    if (data && !draft) setDraft(data);
  }, [data, draft, setDraft]);

  if (isLoading || !draft) {
    return <div className="text-muted-foreground">Loading settings…</div>;
  }

  const dirty = data ? JSON.stringify(data) !== JSON.stringify(draft) : false;

  async function handleSave() {
    if (!draft) return;
    await update.mutateAsync(draft);
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  }

  function detectTimezone() {
    const tz = Intl.DateTimeFormat().resolvedOptions().timeZone;
    if (tz) patch({ timezone: tz });
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Goal</CardTitle>
          <CardDescription>What you&apos;re aiming for and by when.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-2">
            <Label htmlFor="goalTotal">Target contributions (this year)</Label>
            <Input
              id="goalTotal"
              type="number"
              min={1}
              value={draft.goalTotal}
              onChange={(e) => patch({ goalTotal: Number(e.target.value) })}
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="dailyThreshold">A day counts at ≥ N contributions</Label>
            <Input
              id="dailyThreshold"
              type="number"
              min={1}
              max={100}
              value={draft.dailyThreshold}
              onChange={(e) => patch({ dailyThreshold: Number(e.target.value) })}
            />
            <p className="text-xs text-muted-foreground">
              Default is 1. Set higher for a stricter bar. Aim for real work — the
              point is genuine contributions, not commits engineered to keep a
              streak alive.
            </p>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Timezone &amp; reset</CardTitle>
          <CardDescription>
            Your streak resets at your local midnight, not UTC.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-2">
            <Label htmlFor="timezone">Timezone</Label>
            <div className="flex gap-2">
              <select
                id="timezone"
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                value={draft.timezone}
                onChange={(e) => patch({ timezone: e.target.value })}
              >
                {zones.includes(draft.timezone) ? null : (
                  <option value={draft.timezone}>{draft.timezone}</option>
                )}
                {zones.map((z) => (
                  <option key={z} value={z}>
                    {z}
                  </option>
                ))}
              </select>
              <Button type="button" variant="outline" onClick={detectTimezone}>
                Detect
              </Button>
            </div>
          </div>

          <div className="flex items-center justify-between rounded-lg border p-3">
            <div>
              <Label htmlFor="freeze">Streak freeze</Label>
              <p className="text-xs text-muted-foreground">
                Forgive one missed day per streak.
              </p>
            </div>
            <Switch
              id="freeze"
              checked={draft.freezeEnabled}
              onCheckedChange={(v) => patch({ freezeEnabled: v })}
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Reminders</CardTitle>
          <CardDescription>
            Sent server-side, and only if today&apos;s threshold isn&apos;t met yet.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-2">
            <Label htmlFor="reminderTime">Daily reminder time</Label>
            <Input
              id="reminderTime"
              type="time"
              value={draft.reminderTime}
              onChange={(e) => patch({ reminderTime: e.target.value })}
            />
          </div>

          <div className="flex items-center justify-between rounded-lg border p-3">
            <div>
              <Label htmlFor="lastCall">&ldquo;Last call&rdquo; reminder</Label>
              <p className="text-xs text-muted-foreground">
                A later evening nudge if the day is still short.
              </p>
            </div>
            <Switch
              id="lastCall"
              checked={draft.lastCallEnabled}
              onCheckedChange={(v) => patch({ lastCallEnabled: v })}
            />
          </div>

          {draft.lastCallEnabled ? (
            <div className="grid gap-2">
              <Label htmlFor="lastCallTime">Last call time</Label>
              <Input
                id="lastCallTime"
                type="time"
                value={draft.lastCallTime}
                onChange={(e) => patch({ lastCallTime: e.target.value })}
              />
            </div>
          ) : null}
          <p className="text-xs text-muted-foreground">
            Reminder windows are evaluated by the scheduled heartbeat. Make sure
            your cron runs on or after these times (twice daily covers both).
          </p>
        </CardContent>
      </Card>

      <div className="flex items-center gap-3">
        <Button onClick={handleSave} disabled={!dirty || update.isPending}>
          <Save className="h-4 w-4" />
          {update.isPending ? "Saving…" : "Save changes"}
        </Button>
        {dirty ? (
          <Button variant="ghost" onClick={() => data && clear()}>
            Reset
          </Button>
        ) : null}
        {saved ? <span className="text-sm text-primary">Saved ✓</span> : null}
        {update.isError ? (
          <span className="text-sm text-destructive">
            {(update.error as Error)?.message ?? "Save failed"}
          </span>
        ) : null}
      </div>
    </div>
  );
}
