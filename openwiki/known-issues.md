---
type: concept
title: Known Issues
description: Verified divergences between Redis Explorer's documentation and its code, dead code that looks load-bearing, and behavioural traps worth knowing before changing anything.
resource: src/services/redis.ts
tags: [gotchas, tech-debt, dead-code, divergences]
timestamp: 2026-07-19T10:31:24Z
---

# Known Issues

Everything here was confirmed by reading the code at the commit this wiki was generated from. Where `README.md` and the code disagree, the code is described as authoritative.

## Documentation vs. code

| Claim | Reality |
| --- | --- |
| `README.md`: "SSL/TLS secure connections" | The `ssl` field is stored on the connection record but never turned into an `ioredis` `tls` option by `SessionManager`. TLS is silently ignored. See [Connections](connections.md). |
| `README.md`: set `REDIS_URL` in `.env.local` to configure a default connection | Nothing in `src/` reads `REDIS_URL`, `REDIS_HOST`, `REDIS_PORT`, `REDIS_PASSWORD` or `REDIS_DATABASE`. Connections come only from the UI. See [Operations](operations.md). |
| `README.md`: "Advanced key search with pattern matching (Redis SCAN)" | Only the default paged listing uses `SCAN`. Every "load all" path uses blocking `KEYS`. See [Key Browser](key-browser.md). |
| `README.md`: arm64 "coming soon"; release notes list amd64 only | Multi-arch amd64 + arm64 builds were added in commit `5ede5a1`. The docs lag. |
| `README.md`: "Secure authentication with password protection" | No middleware or API gate enforces the JWT on the data plane. See [Authentication](authentication.md). |
| `.env.example`: `NEXTAUTH_SECRET`, `SENTRY_DSN`, analytics and feature-flag variables | Unread by any code. |

The root-level design notes (`TREE_VIEW.md`, `METRICS_HISTORY.md`, `SERVER_STORAGE_ARCHITECTURE.md`, `PERSISTENT_CONNECTIONS.md` and about ten more) are point-in-time proposals, not maintained documentation.

## Dead code

Do not spend time editing these expecting an effect:

- `src/app/api/middleware.ts` — a complete JWT gate with a `PUBLIC_ROUTES` allowlist that Next.js never loads. Only `src/middleware.ts` runs.
- `src/utils/auth.ts` — `verifyAuthToken` and `requireAuth`, imported by nothing.
- `src/lib/server-only.ts` — `requireServerOnly()` using a dynamic `require`, unused by the Redis layer.
- `src/components/Dashboard.old.tsx`, `src/components/KeysBrowser.backup.tsx`, `src/hooks/useConnectionErrorHandler.ts.new`, `src/store/slices/statsSlice.ts.new` — checked-in scratch copies.
- `ENCRYPTION_KEY` in `src/utils/connectionStorage.ts` — declared, never used.
- `react-window` and `react-virtualized` are dependencies; neither is used. `socket.io` is a dependency; the live feeds use SSE.

## The two connection layers

The single most expensive thing to discover the hard way. `src/services/redis.ts` (`redisService`) holds one process-wide `activeConnection` shared by every browser; `src/services/session-manager.ts` pools per connection id and keys sessions by cookie. They do not see each other.

- `POST /api/redis/connect` and `GET /api/redis/keys/stream` use the legacy singleton.
- Everything else uses the session manager.

So `/connect` followed by `/keys` returns 503, and `/connect-session` leaves `/keys/stream` broken. `redis-client.ts` still points its `connect()` at the legacy `/connect`. Beyond the confusion, `redisService.activeConnection` is a cross-tenant leak by construction: whoever connected last owns it for everyone on the legacy paths. Prefer `getRedisFromSession()` in anything new, and treat removing `redisService` as the cleanest available refactor.

## Correctness bugs

- **No real pagination.** `GET /api/redis/keys` never returns the SCAN cursor, so a second page cannot be requested.
- **`getAllKeys` reads `result.total`**, which only the `loadAll` branch of the route sets — `undefined` on the SCAN branch.
- **`TreeBuilder.searchInTree` hardcodes `':'`** when deriving ancestor paths, so search-driven expansion breaks for any other separator.
- **Metrics retention limits contradict each other.** `MAX_POINTS_PER_METRIC = 1440` at a 2-second poll cadence is ~48 minutes, not the 24 hours the `24h` chart period implies. See [Metrics and Alerts](metrics.md).
- **`getStats` fabricates command statistics** when `commandstats` is empty, inventing rows from percentages of `total_commands_processed` and returning them as if measured.
- **`getStats`'s `avgTtl` is `totalExpires / totalKeys`** — a ratio of counts, not an average TTL.
- **CPU and ping history are static class fields** on `redisService`, not keyed by connection, so samples from different Redis servers blend into one series.
- **The two zset write paths disagree.** `PUT /api/redis/value` spreads its array raw, requiring `[score, member, …]`; `redis.ts` builds `[index, item]` pairs instead.
- **The `stats` slice divides cumulative counters by a hardcoded 5** for `evictionsPerSec`, `expiredPerSec` and `rejectedConnPerSec`, so those are not rates.
- **`POST /api/redis` parses the session cookie with `/session=([^;]+)/`.** It happens to match `redis-explorer-session=`, but would collide with any other cookie name ending in `session`. Use `cookies()` like every other route.
- **`POST /api/redis/command` splits on whitespace**, so quoted arguments containing spaces break.
- **`redisService.executeCommand` does `redis[cmd](...args)`** on a lowercased user string, making prototype-reachable properties callable. The route version correctly uses `redis.call(...)`.
- **`keys/prefix` Lua uses `unpack(keys)`** (bounded by the Lua stack) and passes `numkeys = 0` while touching keys, which breaks on Redis Cluster.
- **`keys/load-all` calls its own HTTP API** via `NEXTAUTH_URL || 'http://localhost:3000'` to mirror status it already holds in process, and does background work after the response returns.
- **`decrypt` failures return the input unchanged**, silently writing plaintext passwords to disk.

## Test and build configuration

- `jest.config.js` uses **`moduleNameMapping`**, which is not a Jest option — the correct key is `moduleNameMapper`. The block is silently dead; the `@/` alias survives only via `next/jest`'s tsconfig-paths inference.
- `jest.setup.js` mocks `next/router` (Pages Router) while the app uses `next/navigation` (App Router), so component tests touching `useRouter` or `useParams` get no mock.
- `next.config.js` ignores both ESLint and TypeScript errors during builds.
- The highest-value untested pure logic is `TreeBuilder.detectSeparator` and the `metrics-storage` retention math. Both are deterministic and easy to cover.

## Security posture

Collected here for one glance; details in [Authentication](authentication.md) and [Operations](operations.md).

- `JWT_SECRET` and `REDIS_EXPLORER_KEY` both have hardcoded defaults, and no shipped deployment manifest sets either.
- The data plane authenticates on a cookie that middleware gives to anyone, including `FLUSHALL` via `/api/redis/maintenance` and arbitrary commands via `/api/redis/command`.
- Minimum password length is 4; there is no login rate limiting; changing the password does not invalidate existing tokens.
- `data/` is not gitignored and runtime state has been committed to the repository.
- `AuthContext` logs auth-flow state to the console on every check.
