---
type: concept
title: Connections
description: How Redis connection definitions are shaped, encrypted and persisted to disk, how a browser session attaches to one through the pooled session manager, and how switching and disconnecting work.
resource: src/services/connection-storage.ts
tags: [connections, storage, encryption, ioredis, session]
timestamp: 2026-07-19T10:31:24Z
---

# Connections

A *connection* is a saved definition of a Redis target. Attaching a browser session to one is a separate step, handled by the session pool described in [Architecture](architecture.md).

## The record

`RedisConnection` in `src/types/redis.ts`:

```ts
{ id, name, host, port, password?, database?, ssl?, connected }
```

`connected` is forced to `false` on every save — it is a transient UI flag, not persisted truth.

## Where it is stored

`src/services/connection-storage.ts` resolves a data directory in this order:

1. `REDIS_EXPLORER_DATA_DIR`, if set, wins outright.
2. Otherwise per platform: `APPDATA` on Windows, `~/Library/Application Support` on macOS, `XDG_DATA_HOME` or `~/.local/share` on Linux, `~/.redis-explorer` as a final fallback.

Connections land in `<dir>/redis-explorer/connections.json`. The Docker image sets `REDIS_EXPLORER_DATA_DIR=/app/data` and declares it a volume, which is why the `-v redis-explorer-data:/app/data` flag in [Operations](operations.md) is what makes connections survive a restart.

`src/services/metrics-storage.ts` reads the same env var for its own subdirectory, so one volume covers both.

### Password encryption

Passwords are stored **reversibly encrypted**, because the app must replay them to Redis. AES-256-CBC with a random IV per value, serialized as `<ivHex>:<cipherHex>`. The key is derived with `crypto.scryptSync(ENCRYPTION_KEY, 'salt', 32)` where `ENCRYPTION_KEY` comes from the `REDIS_EXPLORER_KEY` environment variable.

Three things to know before relying on this:

- `REDIS_EXPLORER_KEY` **has a hardcoded default**. On a default install the ciphertext is decryptable by anyone who obtains `connections.json`. Always set it in production; `README.md` says as much and it is correct on this point.
- The scrypt salt is the constant string `'salt'`, so the same passphrase always yields the same key.
- Both `encrypt` and `decrypt` swallow exceptions and return their input unchanged. A failure therefore writes the **plaintext** password to disk silently rather than erroring.

### The browser-side twin

`src/utils/connectionStorage.ts` keeps a parallel copy of the same records in `localStorage` under `redis-explorer-connections`, obfuscating the password with `btoa(encodeURIComponent(...))` — base64, not encryption, as its own comment concedes. It predates the server-side store; `connectionSlice` still ships a `migrateFromLocalStorage` thunk to move users off it. Do not add new writers to this path.

## Managing connections

REST surface in `src/app/api/connections/`:

| Method | Path | Effect |
| --- | --- | --- |
| GET | `/api/connections` | List saved connections. |
| POST | `/api/connections` | Create. |
| PUT | `/api/connections` | Update. |
| DELETE | `/api/connections` and `/api/connections/[id]` | Delete. |
| GET | `/api/connections/export` | Download all definitions as JSON. |
| POST | `/api/connections/import` | Restore from that JSON. |

`POST /api/redis/test-connection` validates host/port/password before saving by opening a throwaway `ioredis` client with `retryStrategy: () => null`, issuing `PING`, and closing it in a `finally`. It never touches the pool.

## Attaching and switching

`POST /api/redis/connect-session` binds the caller's `redis-explorer-session` cookie to a connection id and increments the pool refcount. `POST /api/redis/disconnect` decrements it, quitting the socket when it reaches zero.

On the client this is the `connectToRedis` thunk in `src/store/slices/connectionSlice.ts`. It POSTs to `/connect-session` under a 10-second `AbortController` timeout, clears the keys slice on success, and **rolls back to the previously active connection on failure** — so a bad switch does not strand the UI. The active connection id is mirrored to `localStorage` under `redis-explorer-active-connection` for reload survival.

`src/components/ConnectionSwitcher.tsx` in the app shell and `src/components/ConnectionSelector.tsx` on `/connections` both drive this thunk; `ConnectionManager` and `ConnectionDialog` handle CRUD. Errors surface through `useConnectionErrorHandler`.

## Gotchas

- **`ssl` is stored but never applied.** `SessionManager` builds its `ioredis` options from host, port, password and db only; the `ssl` field never becomes a `tls` option. The "SSL/TLS secure connections" bullet in `README.md` is not backed by the connection code. See [Known Issues](known-issues.md).
- `POST /api/redis/connect` attaches the **legacy global** `redisService` instead of the session pool. It is not the endpoint you want.
- Because the pool lives in process memory, connections do not survive a server restart even though their definitions do.
