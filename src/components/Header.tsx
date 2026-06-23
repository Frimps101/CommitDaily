"use client";

import Link from "next/link";
import { signOut } from "next-auth/react";
import { Flame, RefreshCw, Settings, LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ReminderButton } from "@/components/ReminderButton";
import { cn } from "@/lib/utils";

export function Header({
  onRefresh,
  refreshing,
  showActions = true,
}: {
  onRefresh?: () => void;
  refreshing?: boolean;
  showActions?: boolean;
}) {
  return (
    <header className="sticky top-0 z-40 border-b bg-background/80 backdrop-blur">
      <div className="container flex h-14 items-center justify-between">
        <Link href="/" className="flex items-center gap-2 font-bold">
          <Flame className="h-5 w-5 text-primary" />
          <span>CommitDaily</span>
        </Link>
        {showActions ? (
          <div className="flex items-center gap-1">
            {onRefresh ? (
              <Button
                variant="ghost"
                size="icon"
                onClick={onRefresh}
                disabled={refreshing}
                title="Refresh from GitHub"
              >
                <RefreshCw className={cn("h-4 w-4", refreshing && "animate-spin")} />
              </Button>
            ) : null}
            <ReminderButton />
            <Button variant="ghost" size="icon" asChild title="Settings">
              <Link href="/settings">
                <Settings className="h-4 w-4" />
              </Link>
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => signOut({ callbackUrl: "/" })}
              title="Sign out"
            >
              <LogOut className="h-4 w-4" />
            </Button>
          </div>
        ) : null}
      </div>
    </header>
  );
}
