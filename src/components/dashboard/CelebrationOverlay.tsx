"use client";

import { useEffect } from "react";
import { useUIStore } from "@/store/ui";
import { Button } from "@/components/ui/button";
import { PartyPopper } from "lucide-react";

/**
 * In-app milestone celebration. Shows one moment at a time from the queue;
 * dismissing advances to the next. Deliberately simple — no badge marketplace.
 */
export function CelebrationOverlay() {
  const queue = useUIStore((s) => s.celebrationQueue);
  const dismiss = useUIStore((s) => s.dismissCelebration);
  const current = queue[0];

  useEffect(() => {
    if (current === undefined) return;
    const t = setTimeout(() => dismiss(), 6000);
    return () => clearTimeout(t);
  }, [current, dismiss]);

  if (current === undefined) return null;

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm">
      <div className="relative w-full max-w-sm overflow-hidden rounded-2xl border border-primary/40 bg-card p-8 text-center shadow-2xl">
        <Confetti />
        <PartyPopper className="mx-auto mb-3 h-10 w-10 text-primary" />
        <div className="text-sm font-medium uppercase tracking-wide text-muted-foreground">
          Milestone reached
        </div>
        <div className="my-2 text-5xl font-extrabold text-primary tabular-nums">
          {current.toLocaleString()}
        </div>
        <p className="text-sm text-muted-foreground">
          {current >= 1000
            ? "You hit the goal. 1,000 contributions — incredible."
            : `${current.toLocaleString()} contributions this year. Keep the streak going.`}
        </p>
        <Button className="mt-6 w-full" onClick={dismiss}>
          {queue.length > 1 ? "Next" : "Nice"}
        </Button>
      </div>
    </div>
  );
}

function Confetti() {
  const colors = ["#39d353", "#26a641", "#006d32", "#f59e0b", "#60a5fa"];
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden">
      {Array.from({ length: 24 }).map((_, i) => (
        <span
          key={i}
          className="absolute block h-2 w-2 animate-bounce rounded-sm"
          style={{
            left: `${(i * 37) % 100}%`,
            top: `${(i * 53) % 100}%`,
            background: colors[i % colors.length],
            animationDelay: `${(i % 6) * 120}ms`,
            opacity: 0.85,
          }}
        />
      ))}
    </div>
  );
}
