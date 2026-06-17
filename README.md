# CommitDaily

A Progressive Web App that tracks your GitHub contribution streak and pushes
reminders before you lose a day — Duolingo/Snapchat-style streak mechanics aimed
at one concrete goal: **1,000 contributions by December 31**.

- **Live pace** — `(goal − contributions so far) ÷ days remaining`, recalculated on every load.
- **Streak engine** — current + longest streak, optional one-day **freeze**, reset anchored to **your local midnight** (not UTC).
- **Progress dashboard** — total YTD, remaining to goal, days left, pace, GitHub-style heatmap, cumulative-vs-target trend chart.
- **Server-side reminders** — a scheduled heartbeat sends a Web Push reminder (and an optional evening "last call") only if today's threshold isn't met yet.
- **Milestones** — in-app celebrations at 100 / 250 / 500 / 750 / 1000.
- **Installable PWA** — offline read-only viewing of previously-loaded data.

## Tech stack

| Layer | Choice |
| --- | --- |
| App | Next.js 14 (App Router) — frontend + API in one deployable unit |
| UI | React + TypeScript, Tailwind CSS, shadcn/ui, Recharts, react-calendar-heatmap |
| Server state | TanStack Query · **Local UI state** Zustand (modals, draft settings) |
| DB | PostgreSQL via Prisma (Supabase or Neon) |
| Auth | Auth.js (NextAuth v5), GitHub provider |
| GitHub data | Octokit GraphQL → `contributionsCollection` |
| Push | `web-push` + VAPID (plain Web Push, no Firebase) |
| Schedule | Vercel Cron → one protected heartbeat route |
| PWA | `@ducanh2912/next-pwa` (manifest + service worker + Workbox caching) |

> **One deliberate deviation from the brief.** The spec listed *Vite +
> vite-plugin-pwa* for the frontend *and* *Next.js App Router as one deployed
> unit* for the backend. Those are mutually exclusive. Since "one deployable
> Next.js unit on Vercel" was the stronger, repeated constraint, everything runs
> on Next.js and the PWA uses `@ducanh2912/next-pwa` (a Next-native equivalent of
> vite-plugin-pwa) instead. Every other technology choice is as specified.

## Architecture

Layered but lightweight — no CQRS, no job queue, no Redis.

```
src/
  app/                      # routes (UI pages + thin API route handlers)
    api/.../route.ts        # request/response only — no business logic
  lib/
    services/               # business logic
      githubService.ts      #   GraphQL queries + contribution parsing
      streakService.ts      #   streak / freeze / local-midnight reset (pure)
      statsService.ts       #   pace + milestone math (pure)
      notificationService.ts#   decide-to-send + build payload + send push
      syncService.ts        #   orchestration: fetch → persist → recompute
      heartbeatService.ts   #   cron orchestration per user
      dashboardService.ts   #   read-model composition
    repositories/           # the ONLY layer that touches Prisma
    crypto.ts               # AES-256-GCM token encryption at rest
    date.ts                 # local-midnight vs UTC helpers
    validation.ts           # Zod schemas at the API boundary
  components/               # UI (shadcn primitives + dashboard/settings)
  store/                    # Zustand (UI-only)
  worker/                   # custom service worker (push handlers)
```

## Things this build gets right (not just functional)

- **Local midnight vs UTC.** GitHub buckets contributions by UTC day; a late-night
  local commit can land in GitHub's *next* UTC day. Every date the streak engine
  reasons about is a `yyyy-MM-dd` computed in the user's IANA timezone
  (`src/lib/date.ts`), and "is today done / when does it reset" is measured
  against local midnight. See the doc comments in `date.ts` and `streakService.ts`.
- **Honest threshold.** "A day counts" is `≥ dailyThreshold` real contributions
  (default 1, configurable). The UI explicitly frames the goal as genuine work.
- **Tokens encrypted at rest.** OAuth access/refresh tokens are AES-256-GCM
  encrypted before hitting the DB (adapter wrapper in `src/auth.ts`) and are
  decrypted only inside server services — never sent to the client.
- **Reminders run server-side.** The PWA can't reliably wake itself; a protected
  cron route is the heartbeat. It's idempotent (a `NotificationLog` prevents
  double-sends within a local day).
- **iOS Web Push constraint is handled explicitly**, not discovered later (see below).

## Local setup

### 1. Prerequisites

- Node 18+ and a PostgreSQL database (local, or a free [Neon](https://neon.tech) / [Supabase](https://supabase.com) instance).

### 2. Install

```bash
npm install
```

### 3. Environment

```bash
cp .env.example .env
```

Fill in `.env`:

- **`DATABASE_URL` / `DIRECT_URL`** — your Postgres connection string(s).
- **`AUTH_SECRET`** — `npx auth secret` (or `openssl rand -base64 32`).
- **GitHub OAuth app** — create at <https://github.com/settings/developers>:
  - Homepage URL: `http://localhost:3000`
  - Authorization callback URL: `http://localhost:3000/api/auth/callback/github`
  - Put the client id/secret in `AUTH_GITHUB_ID` / `AUTH_GITHUB_SECRET`.
- **`TOKEN_ENCRYPTION_KEY`** — `openssl rand -base64 32` (must decode to 32 bytes).
- **VAPID keys** — `npm run keys:vapid`, then paste the three lines into `.env`.
- **`CRON_SECRET`** — any random string; the heartbeat requires it.

### 4. Database

```bash
npm run db:push      # apply the Prisma schema
```

### 5. Run

```bash
npm run dev          # http://localhost:3000
```

> The service worker / PWA is disabled in `next dev`. To test installability,
> offline caching, and push end-to-end, run a production build:
>
> ```bash
> npm run build && npm start
> ```

## Reminder scheduling (the heartbeat)

The reminder logic lives in a single protected route:

```
GET /api/cron/heartbeat
Authorization: Bearer <CRON_SECRET>
```

For each user with a push subscription it: refreshes contributions from GitHub,
recomputes today's progress, and — if today's threshold is still unmet and the
reminder/last-call window has passed in the user's timezone — sends one push.

**Vercel Cron** is wired up in `vercel.json` (twice daily). Set `CRON_SECRET` in
the Vercel project; Vercel attaches the `Authorization: Bearer` header
automatically.

> **Timing note.** A fixed-time cron can't perfectly honor an arbitrary
> per-user reminder time across timezones. Twice daily is what the brief asked
> for and is fine for a single user (pick UTC times that fall after your local
> reminder + last-call times). For minute-accurate reminders across users,
> change `vercel.json` to hourly (`"0 * * * *"`) on a plan that allows it — the
> heartbeat stays idempotent and well within GitHub's rate limit (~24 GraphQL
> calls/day ≪ 5000/hr).

You can also drive the heartbeat from a **GitHub Actions** scheduled workflow
that `curl`s the route with the bearer token, if you prefer not to use Vercel
Cron.

Manual test:

```bash
curl -H "Authorization: Bearer $CRON_SECRET" http://localhost:3000/api/cron/heartbeat
```

## Testing push notifications on iOS (do this before calling push "done")

iOS Safari only delivers Web Push to a PWA **installed to the home screen**, on
**iOS 16.4+**. The app detects this and shows an "Install to enable iOS push"
card until it's running standalone. To verify properly:

1. Deploy to HTTPS (Vercel) or use an HTTPS tunnel — iOS requires a secure origin.
2. On the iPhone, open the site in Safari → **Share → Add to Home Screen**.
3. Launch CommitDaily **from the home-screen icon** (not the Safari tab).
4. On the dashboard, **Enable reminders** (grant the permission prompt).
5. Tap **Send test push** (`POST /api/push/test`) and confirm the notification
   arrives. Then trigger the heartbeat to confirm the real reminder path.

Desktop Chrome/Edge and installed Android PWAs work without the install step, but
**don't treat desktop success as iOS success** — test the installed iOS PWA path
explicitly.

## Goal & success metric

The headline number on the dashboard is the **live daily pace**:

```
pace = (goalTotal − contributions so far) ÷ days remaining until Dec 31  (inclusive, local)
```

Hit `pace` (or more) each day and you reach the goal. Configure `goalTotal`,
`dailyThreshold`, timezone, freeze, and reminder times in **Settings**.

## Deploying to Vercel

1. Push to GitHub, import the repo in Vercel.
2. Add all `.env` values as Vercel Environment Variables.
3. Set the GitHub OAuth app's callback URL to
   `https://<your-domain>/api/auth/callback/github` and `AUTH_URL` to your domain.
4. Provision Postgres (Neon/Supabase) and run `npm run db:push` against it
   (or `prisma migrate deploy` if you generate migrations).
5. Vercel picks up `vercel.json` for the cron heartbeat automatically.
```
