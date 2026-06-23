"use client";

import { useEffect, useRef } from "react";
import { Gauge, AlertTriangle, CheckCircle2 } from "lucide-react";
import { Header } from "@/components/Header";
import { StatCard } from "@/components/dashboard/StatCard";
import { Heatmap } from "@/components/dashboard/Heatmap";
import { MilestoneTracker } from "@/components/dashboard/MilestoneTracker";
import { CelebrationOverlay } from "@/components/dashboard/CelebrationOverlay";
import { Card, CardContent } from "@/components/ui/card";
import { useDashboard, useSync } from "@/hooks/useDashboard";
import { cn } from "@/lib/utils";

export function Dashboard() {
  const { data, isLoading, isError, error } = useDashboard();
  const sync = useSync();
  const didSync = useRef(false);

  // Auto-refresh from GitHub once on mount (when online). Offline falls back to
  // the cached read model from the service worker.
  useEffect(() => {
    if (didSync.current) return;
    didSync.current = true;
    if (typeof navigator !== "undefined" && navigator.onLine) {
      sync.mutate();
    }
  }, [sync]);

  if (isLoading && !data) {
    return (
      <div className="min-h-screen">
        <Header showActions={false} />
        <div className="container py-16 text-center text-muted-foreground">
          Loading your streak…
        </div>
      </div>
    );
  }

  if (isError && !data) {
    return (
      <div className="min-h-screen">
        <Header showActions={false} />
        <div className="container py-16 text-center text-destructive">
          {(error as Error)?.message ?? "Failed to load dashboard."}
        </div>
      </div>
    );
  }

  if (!data) return null;

  const { streak, progress, heatmap, milestones } = data;
  const year = Number(progress.deadline.slice(0, 4));

  return (
    <div className="min-h-screen pb-16">
      <Header onRefresh={() => sync.mutate()} refreshing={sync.isPending} />
      <CelebrationOverlay />

      <main className="container space-y-6 py-6">
        <StatusBanner status={streak.status} todayCount={streak.todayCount} />

        {/* Headline pace number */}
        <Card className="overflow-hidden">
          <CardContent className="flex flex-col items-center gap-2 p-8 text-center">
            <div className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
              You need this many contributions per day
            </div>
            <div className="text-6xl font-extrabold tabular-nums text-primary">
              {progress.pace}
            </div>
            <div className="text-sm text-muted-foreground">
              {progress.remaining.toLocaleString()} to go ·{" "}
              {progress.daysRemaining} day{progress.daysRemaining === 1 ? "" : "s"} left until{" "}
              {progress.deadline}
            </div>
            <ProgressBar percent={progress.percent} />
            <div className="text-xs text-muted-foreground">
              {progress.total.toLocaleString()} / {progress.goalTotal.toLocaleString()} ·{" "}
              {progress.percent}%
            </div>
          </CardContent>
        </Card>

        <div className="grid grid-cols-3 gap-4">
          <StatCard
            label="Current streak"
            value={streak.currentStreak}
            accent="primary"
            hint={streak.freezeUsed ? "freeze used" : undefined}
          />
          <StatCard label="Longest streak" value={streak.longestStreak} />
          <StatCard label="Today" value={streak.todayCount} hint={streak.todayMet ? "met ✓" : "not met yet"} accent={streak.todayMet ? "primary" : "warning"} />
        </div>

        <Heatmap days={heatmap} year={year} />

        <MilestoneTracker all={milestones.all} total={progress.total} />

        <p className="flex items-start gap-2 text-xs text-muted-foreground">
          <Gauge className="mt-0.5 h-3.5 w-3.5 shrink-0" />
          Private-repo contributions only appear here if you&apos;ve enabled
          &ldquo;Include private contributions on my profile&rdquo; in your GitHub
          settings. The streak boundary uses your local midnight ({data.settings.timezone}),
          not UTC.
        </p>
      </main>
    </div>
  );
}

function ProgressBar({ percent }: { percent: number }) {
  return (
    <div className="mt-2 h-3 w-full max-w-md overflow-hidden rounded-full bg-muted">
      <div
        className="h-full rounded-full bg-primary transition-all"
        style={{ width: `${Math.min(100, Math.max(0, percent))}%` }}
      />
    </div>
  );
}

function StatusBanner({
  status,
  todayCount,
}: {
  status: "safe" | "at_risk" | "broken";
  todayCount: number;
}) {
  if (status === "safe") {
    return (
      <div className="flex items-center gap-2 rounded-lg border border-primary/30 bg-primary/10 p-3 text-sm text-primary">
        <CheckCircle2 className="h-4 w-4" />
        Today&apos;s done — {todayCount} contribution{todayCount === 1 ? "" : "s"}. Streak safe.
      </div>
    );
  }
  if (status === "at_risk") {
    return (
      <div className="flex items-center gap-2 rounded-lg border border-amber-500/30 bg-amber-500/10 p-3 text-sm text-amber-300">
        <AlertTriangle className="h-4 w-4" />
        Streak alive but today isn&apos;t logged yet — commit before your local midnight.
      </div>
    );
  }
  return (
    <div className="flex items-center gap-2 rounded-lg border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive">
      <AlertTriangle className="h-4 w-4" />
      No active streak. Make a contribution today to start a new one.
    </div>
  );
}
