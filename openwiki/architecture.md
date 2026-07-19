---
type: concept
title: Architecture
description: How a browser request in Redis Explorer travels through the Next.js App Router, the /api route layer, and the server-side ioredis session pool, and why two competing connection layers coexist.
resource: src/services/session-manager.ts
tags: [architecture, nextjs, app-router, ioredis, session]
timestamp: 2026-07-19T10:31:24Z
---

# Architecture

Redis Explorer is one Next.js 15 application with no separate backend. `next.config.js` sets `output: 'standalone'`, so the production artifact is a self-contained Node server.

## Request path

```
Browser (React client components, Redux)
  └─ fetch(..., { credentials: 'include' })     src/services/redis-client.ts
       └─ Next.js API route under src/app/api/  (Node runtime)
            └─ getRedisFromSession()            src/lib/session-helper.ts
                 └─ sessionManager.getRedis()   src/services/session-manager.ts
                      └─ ioredis client         → Redis server
```

The browser never holds Redis credentials or opens a Redis socket. Identity is carried by an httpOnly cookie, so every client `fetch` must pass `credentials: 'include'` — `src/services/redis-client.ts` and `src/services/api/redis-api.ts` do this consistently, and any new call site must too.

## Layer map

| Directory | Role |
| --- | --- |
| `src/app/(auth)/` | Login and first-run setup pages. See [Authentication](authentication.md). |
| `src/app/(app)/` | The authenticated shell (AppBar, Drawer, `MetricsProvider`) and its pages. See [Frontend](frontend.md). |
| `src/app/connections/` | Connection picker. Deliberately outside both route groups, so it renders without the app chrome. |
| `src/app/api/` | Every server endpoint. Cataloged in [API Reference](api-reference.md). |
| `src/services/` | Server-side Redis, session, connection-storage and metrics logic, plus the browser-side HTTP clients. |
| `src/store/` | Redux Toolkit store and slices. |
| `src/hooks/`, `src/contexts/` | Client state: polling loops, TTL countdown, tree view, auth context. |
| `src/utils/`, `src/lib/` | Pure helpers (tree building, formatting) and server-only glue (cookies, session lookup, init). |

## The session layer

`src/middleware.ts` is the only real middleware Next.js loads. It does exactly one thing: if the request has no `redis-explorer-session` cookie, it mints a `uuidv4()` and sets it httpOnly, `sameSite: 'lax'`, 30-day max age. It performs **no authentication** — that gap is covered in [Authentication](authentication.md).

`SessionManager` (`src/services/session-manager.ts`) is the heart of the server. It holds two in-memory maps:

- `sessions: Map<sessionId, { connectionId, lastActivity }>` — which Redis target a browser session is currently attached to.
- `connections: Map<connectionId, { redis, sessionCount }>` — one pooled `ioredis` client per connection definition, reference counted.

Pooling is keyed by **connection id, not session id**, so ten browser tabs pointed at the same Redis share one socket. `decrementConnectionUsage` calls `quit()` when `sessionCount` reaches zero. Clients are created with `enableReadyCheck: false`, `maxRetriesPerRequest: null` and `lazyConnect: true` followed by an explicit `connect()`.

Reconnection is written defensively: when a session re-attaches to an id it already holds, the manager `PING`s the existing client first and only rebinds `session.connectionId` after a new connect succeeds, so a failed switch leaves the previous working connection intact. A cleanup interval runs every 10 minutes and evicts sessions idle for more than 24 hours.

Two consequences follow from the maps being in process memory:

- **The singleton is only stashed on `globalThis` outside production** (`process.env.NODE_ENV !== 'production'`), to survive dev hot reload. In production each worker or replica has its own map, so this app cannot be horizontally scaled without sticky routing. The file-based state in [Connections](connections.md) and [Metrics and Alerts](metrics.md) caps it at one replica anyway.
- A server restart drops all live connections; clients must re-issue `POST /api/redis/connect-session`.

## The second, legacy connection layer

`src/services/redis.ts` exports `redisService`, an older process-wide singleton with a single `activeConnection: string | null` shared by **every** browser hitting the server. It is still reachable, and this is the largest trap in the codebase:

- `POST /api/redis/connect` writes to `redisService`.
- `GET /api/redis/keys/stream` reads from `redisService`.
- Essentially everything else — `keys`, `value`, `command`, `stats`, `config`, `slowlog`, `monitor` — reads from `sessionManager`.

So connecting through `/api/redis/connect` and then calling `/api/redis/keys` returns `503 No active Redis connection for this session`, and connecting through `/api/redis/connect-session` leaves `/api/redis/keys/stream` broken. The Redux `connectToRedis` thunk currently calls `/connect-session`, which is the correct path. Treat `redisService` as deprecated; prefer `getRedisFromSession()` in anything new. Details and the other consequences are in [Known Issues](known-issues.md).

## Server-only initialisation

`src/lib/init-server.ts` is a side-effect module that starts the metrics cleanup job on import. It is imported by exactly one file, `src/app/api/redis/metrics/route.ts`, so the hourly sweep only begins after something first requests metrics. That is described further in [Metrics and Alerts](metrics.md).
