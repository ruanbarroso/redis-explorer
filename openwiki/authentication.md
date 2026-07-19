---
type: concept
title: Authentication
description: Redis Explorer's single shared-password login, the bcrypt hash on disk, the auth-token JWT and redis-explorer-session cookies, and the gap between the intended and the enforced authorization model.
resource: src/lib/auth-cookie.ts
tags: [auth, jwt, cookies, bcrypt, security]
timestamp: 2026-07-19T10:31:24Z
---

# Authentication

There are no user accounts. The application is guarded by **one shared admin password**, created on first run.

## The password

`POST /api/auth/setup` accepts a password on first run only — it refuses if the credential file already exists — hashes it with bcrypt (cost factor 12) and writes `{ passwordHash, createdAt, updatedAt }` to `data/auth.json` under `process.cwd()`. `POST /api/auth/change-password` verifies the current password and rewrites the same file.

Note that this path is `process.cwd()/data`, **not** the `REDIS_EXPLORER_DATA_DIR` location used for connections in [Connections](connections.md). In the Docker image these happen to coincide because the working directory is `/app` and the env var is set to `/app/data`, but outside the container they diverge.

The minimum password length enforced by both `setup` and `change-password` is **4 characters**, and there is no rate limiting on `POST /api/auth/login`. Changing the password does not invalidate tokens already issued.

## Cookies

Two separate cookies, with different lifetimes and different jobs:

| Cookie | Contents | Lifetime | Set by |
| --- | --- | --- | --- |
| `auth-token` | JWT signed with `JWT_SECRET`, `expiresIn: '24h'` | 24 h | `/api/auth/login`, `/api/auth/setup` |
| `redis-explorer-session` | Random `uuidv4()` | 30 days | `src/middleware.ts`, unconditionally |

Both are httpOnly, `sameSite: 'lax'`, `path: '/'`. The session cookie is what keys the Redis connection pool described in [Architecture](architecture.md); it identifies a browser, not a logged-in human.

There is no sliding renewal — after 24 hours the JWT simply fails verification and the client redirects to `/login`.

### The Secure flag

`src/lib/auth-cookie.ts` derives `secure` per request rather than hardcoding it, because the app is commonly reached over plain HTTP on an internal `IP:port` where a `Secure` cookie would silently break login. Precedence:

1. `FORCE_HTTPS=true` → always `Secure`.
2. `DISABLE_SECURE_COOKIE=true` → never `Secure`.
3. Otherwise derived from the first value of the `x-forwarded-proto` header, falling back to `request.nextUrl.protocol` — so it works behind a TLS-terminating proxy.

This is the one piece of the codebase with real test coverage: `__tests__/auth-cookie.test.ts` exercises `isSecureRequest`, `shouldUseSecureCookie` and the resulting cookie options. Preserve those tests when touching this file.

## What is actually enforced

This is the part that matters and the part the `README.md` feature list ("Secure authentication with password protection") does not convey.

- **`src/middleware.ts` protects nothing.** It only mints the session cookie and calls `NextResponse.next()`.
- `src/app/api/middleware.ts` *does* implement a JWT gate with a `PUBLIC_ROUTES` allowlist, but Next.js only loads middleware from `src/middleware.ts` or the project root. That file is **never executed**.
- `src/utils/auth.ts` exports `verifyAuthToken` and `requireAuth`. Nothing imports them.
- Of all the API routes, only `/api/auth/change-password` verifies the JWT. Every `/api/redis/*` and `/api/connections/*` route authenticates on the `redis-explorer-session` cookie alone — which middleware hands to any caller, authenticated or not.
- All remaining authorization is **client-side redirects**: `src/app/page.tsx`, `src/app/(app)/layout.tsx` and per-page `useEffect` hooks.

The practical result is that an unauthenticated HTTP client that first establishes a session via `POST /api/redis/connect-session` can reach the whole data plane, including `POST /api/redis/command` and `POST /api/redis/maintenance` with `FLUSHALL`. Treat any deployment as trusted-network-only until this is fixed. The endpoints in question are listed in [API Reference](api-reference.md).

### JWT_SECRET

`JWT_SECRET` falls back to a hardcoded literal in five places (`src/utils/auth.ts`, and the `login`, `setup`, `verify`, `change-password` routes). Neither `Dockerfile`, `docker-compose.yml` nor `k8s/deployment.yaml` sets it, so the published image runs on the default and tokens can be forged. Setting a real value is the single highest-value change in [Operations](operations.md).

## Client side

`src/contexts/AuthContext.tsx` wraps the app and calls `/api/auth/verify` to establish state, exposing `refreshAuth()` used by the login page after a successful POST. `src/hooks/useAuth.ts` and `src/hooks/useAuthWithModals.ts` consume it; `src/components/AuthModals.tsx` renders the logout confirmation and change-password dialogs mounted in `src/app/(app)/layout.tsx`. `useCrossTabSync` keeps multiple tabs consistent. The context currently logs its state transitions to the console on every check, which is noisy in production.
