"use client";

import { signIn } from "next-auth/react";
import { Flame, Bell, Calendar, Gauge, Snowflake } from "lucide-react";

function GithubIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className} aria-hidden="true">
      <path d="M12 .5C5.73.5.5 5.73.5 12c0 5.08 3.29 9.39 7.86 10.91.58.11.79-.25.79-.56 0-.28-.01-1.02-.02-2-3.2.7-3.88-1.54-3.88-1.54-.53-1.34-1.29-1.7-1.29-1.7-1.05-.72.08-.71.08-.71 1.16.08 1.77 1.19 1.77 1.19 1.03 1.77 2.7 1.26 3.36.96.1-.75.4-1.26.73-1.55-2.55-.29-5.24-1.28-5.24-5.69 0-1.26.45-2.29 1.19-3.09-.12-.29-.52-1.46.11-3.05 0 0 .97-.31 3.18 1.18a11.1 11.1 0 0 1 2.9-.39c.98 0 1.97.13 2.9.39 2.2-1.49 3.17-1.18 3.17-1.18.63 1.59.23 2.76.11 3.05.74.8 1.19 1.83 1.19 3.09 0 4.42-2.69 5.39-5.25 5.68.41.35.78 1.05.78 2.12 0 1.53-.01 2.76-.01 3.14 0 .31.21.68.8.56A10.52 10.52 0 0 0 23.5 12C23.5 5.73 18.27.5 12 .5z" />
    </svg>
  );
}
import { Button } from "@/components/ui/button";
import { Header } from "@/components/Header";

export function Landing() {
  return (
    <div className="min-h-screen">
      <Header showActions={false} />
      <main className="container flex flex-col items-center py-16 text-center">
        <Flame className="h-14 w-14 text-primary" />
        <h1 className="mt-4 max-w-2xl text-4xl font-extrabold tracking-tight sm:text-5xl">
          Don&apos;t break the chain.
        </h1>
        <p className="mt-4 max-w-xl text-lg text-muted-foreground">
          CommitDaily turns your GitHub contributions into a streak and
          push reminders before you lose a day. Duolingo, but for shipping code.
        </p>

        <Button size="lg" className="mt-8" onClick={() => signIn("github", { callbackUrl: "/" })}>
          <GithubIcon className="h-5 w-5" /> Continue with GitHub
        </Button>
        <p className="mt-3 max-w-md text-xs text-muted-foreground">
          We request read-only access to your contribution data. Private-repo
          contributions show up only if you&apos;ve enabled &ldquo;Include private
          contributions on my profile&rdquo; in GitHub settings.
        </p>

        <div className="mt-14 grid w-full max-w-3xl gap-4 sm:grid-cols-2">
          <Feature icon={<Gauge className="h-5 w-5 text-primary" />} title="Live daily pace" body="(1000 − so far) ÷ days left, recalculated every load." />
          <Feature icon={<Bell className="h-5 w-5 text-primary" />} title="Server-side reminders" body="A scheduled heartbeat nudges you even when the app is closed." />
          <Feature icon={<Calendar className="h-5 w-5 text-primary" />} title="Contribution heatmap" body="A GitHub-style graph for an at-a-glance check." />
          <Feature icon={<Snowflake className="h-5 w-5 text-primary" />} title="Streak freeze" body="One missed day forgiven — reset anchored to your local midnight." />
        </div>
      </main>
    </div>
  );
}

function Feature({
  icon,
  title,
  body,
}: {
  icon: React.ReactNode;
  title: string;
  body: string;
}) {
  return (
    <div className="rounded-xl border bg-card p-5 text-left">
      <div className="mb-2">{icon}</div>
      <div className="font-semibold">{title}</div>
      <div className="mt-1 text-sm text-muted-foreground">{body}</div>
    </div>
  );
}
