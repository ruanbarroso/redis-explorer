---
type: concept
title: Quickstart
description: Redis Explorer is a self-hosted web GUI for Redis built on Next.js 15 and React 19; this page explains what it does, how to run it locally, and which concept pages to read next.
resource: package.json
tags: [quickstart, onboarding, nextjs, redis]
timestamp: 2026-07-19T10:31:24Z
---

# Quickstart

## What this is

Redis Explorer is a **self-hosted, browser-based GUI for Redis** — a web alternative to RedisInsight. `package.json` describes it as "Modern Redis GUI Explorer - Alternative to RedisInsight", MIT licensed, published as a Docker image at `ruanbarroso/redis-explorer`.

It is a single Next.js 15 application (App Router, React 19, TypeScript). The browser never talks to Redis directly: every operation goes through a Next.js API route that runs `ioredis` server-side. See [Architecture](architecture.md) for the request path.

What it gives you, all verified against the code rather than the feature list in `README.md`:

- **Connection management** — define multiple Redis targets, test them, persist them server-side, import/export as JSON. See [Connections](connections.md).
- **Key browsing** — pattern search, a hierarchical tree view with automatic separator detection, streaming loads for large keyspaces, bulk delete by prefix. See [Key Browser](key-browser.md).
- **Value editing** — read and write strings, hashes, lists, sets and sorted sets, with TTL management, through a Monaco-based editor.
- **Dashboard, monitoring and alerts** — metrics derived from `INFO`, persisted as time series per connection and charted. See [Metrics and Alerts](metrics.md).
- **CLI terminal** — arbitrary Redis commands via `POST /api/redis/command`.
- **Slow log** and **live `MONITOR` stream** over Server-Sent Events.

Everything is behind a **single shared admin password** set on first run — there are no user accounts. Read [Authentication](authentication.md) before deploying this anywhere reachable, because the enforcement is weaker than it looks.

## Run it locally

Requires Node >= 18 and Yarn >= 1.22 (`package.json` `engines`).

```bash
yarn install
cp .env.example .env.local   # optional; every value has a default
yarn dev                     # next dev --turbo, serves http://localhost:3000
```

On first visit `/` redirects to `/setup`, where you create the admin password. After logging in you land on `/connections` to define a Redis target, then on `/dashboard`. That redirect chain lives in `src/app/page.tsx`; the full page map is in [Frontend](frontend.md).

You need a Redis server to point at. `docker-compose.yml` brings up the app plus a plain `redis:7-alpine` on 6379 and a password-protected one on 6380:

```bash
docker-compose up -d
```

Or run only the published image, mounting a volume so your connections and password survive a restart:

```bash
docker run -d -p 3000:3000 -v redis-explorer-data:/app/data ruanbarroso/redis-explorer:latest
```

See [Operations](operations.md) for the environment variables that matter in a real deployment — in particular `JWT_SECRET` and `REDIS_EXPLORER_KEY`, neither of which is set by any shipped deployment manifest.

## Other scripts

| Command | Effect |
| --- | --- |
| `yarn build` / `yarn start` | Production build (`output: 'standalone'`) and serve. |
| `yarn test` / `yarn test:watch` | Jest. Only two test files exist — see below. |
| `yarn type-check` | `tsc --noEmit`. Worth running: the build itself ignores type errors. |
| `yarn lint` / `yarn lint:fix` | ESLint via `next lint`. |
| `yarn format` | Prettier over the repo. |

## Where to start as an agent

1. Read [Architecture](architecture.md) first. The single most important fact about this codebase is that there are **two competing Redis connection layers** (a per-session pool and a legacy process-global singleton) and different routes use different ones. Getting this wrong produces confusing 503s.
2. Then read [Known Issues](known-issues.md). It lists the divergences between `README.md` and the code, plus dead code that looks load-bearing but is not (`src/app/api/middleware.ts`, `src/utils/auth.ts`).
3. For any change to keys, values or scanning, [Key Browser](key-browser.md) and [API Reference](api-reference.md) together cover the whole surface.

### Testing reality

`__tests__/auth-cookie.test.ts` is the only meaningful suite — it covers the `Secure` flag derivation in `src/lib/auth-cookie.ts`. `__tests__/index.test.tsx` is a placeholder asserting `true === true`. There is no coverage of the store, the API routes, tree building or metrics storage, so **behavioural changes are not caught by CI**; verify by hand. `jest.config.js` also contains a typo (`moduleNameMapping` instead of `moduleNameMapper`) documented in [Known Issues](known-issues.md).

### Cautions

- The repo has a large set of legacy design notes at the root (`TREE_VIEW.md`, `METRICS_HISTORY.md`, `SERVER_STORAGE_ARCHITECTURE.md`, and roughly ten more). They describe intent at the time of writing and are not maintained. Prefer the code, then this wiki.
- Several files are checked in that look like scratch work and are not imported: `src/components/Dashboard.old.tsx`, `src/components/KeysBrowser.backup.tsx`, `src/hooks/useConnectionErrorHandler.ts.new`, `src/store/slices/statsSlice.ts.new`. Do not edit them expecting an effect.
- `data/` is not gitignored, so runtime state has been committed to the repository. Never add anything to it in a commit.
