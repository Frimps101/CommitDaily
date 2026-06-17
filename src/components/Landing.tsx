"use client";

import { signIn } from "next-auth/react";
import { Flame, Github, Bell, Calendar, Gauge, Snowflake } from "lucide-react";
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
          CommitDaily turns your GitHub contributions into a streak — with a live
          pace to <span className="font-semibold text-foreground">1,000 by Dec 31</span> and
          push reminders before you lose a day. Duolingo, but for shipping code.
        </p>

        <Button size="lg" className="mt-8" onClick={() => signIn("github", { callbackUrl: "/" })}>
          <Github className="h-5 w-5" /> Continue with GitHub
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
