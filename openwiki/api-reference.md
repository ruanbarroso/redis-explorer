---
type: concept
title: API Reference
description: Catalog of every Redis Explorer HTTP endpoint under /api — auth, connections, and the Redis data plane — with method, purpose, and the Redis commands each one issues.
resource: src/app/api
tags: [api, routes, endpoints, rest, sse]
timestamp: 2026-07-19T10:31:24Z
---

# API Reference

Every endpoint lives under `src/app/api/` and runs on the Node runtime. Unless noted, a Redis route resolves its client through `getRedisFromSession()` and answers `503 No active Redis connection for this session` when the caller's `redis-explorer-session` cookie is not attached to a connection. The mechanics are in [Architecture](architecture.md).

All browser callers must send `credentials: 'include'`.

## Auth

| Method | Path | Purpose |
| --- | --- | --- |
| POST | `/api/auth/setup` | First-run password creation; refuses once the credential file exists. Issues the `auth-token` cookie. |
| POST | `/api/auth/login` | Verify password with bcrypt, issue `auth-token`. No rate limiting. |
| POST | `/api/auth/logout` | Clear `auth-token`. |
| GET | `/api/auth/verify` | Report whether the current JWT is valid; drives `AuthContext`. |
| POST | `/api/auth/change-password` | Verify current password, rewrite the hash. The **only** route that checks the JWT. |

See [Authentication](authentication.md) for what this does and does not protect.

## Connections

| Method | Path | Purpose |
| --- | --- | --- |
| GET / POST / PUT / DELETE | `/api/connections` | CRUD over saved connection definitions. |
| DELETE | `/api/connections/[id]` | Delete one by id. |
| GET | `/api/connections/export` | Download all definitions as JSON. |
| POST | `/api/connections/import` | Restore definitions from that JSON. |

Persistence and password encryption are covered in [Connections](connections.md).

## Redis data plane

| Method | Path | Purpose | Redis commands |
| --- | --- | --- | --- |
| POST | `/api/redis` | Generic dispatch, calls `redis[command](...args)`. Parses the session cookie with a regex rather than `cookies()`. | arbitrary |
| POST | `/api/redis/connect` | **Legacy.** Attaches the process-global `redisService`, not the session pool. | connection handshake |
| POST | `/api/redis/connect-session` | Attach this session's cookie to a connection id. The correct entry point. | `PING` (reuse check) |
| POST | `/api/redis/disconnect` | Release the session's refcount on the pooled client. | `QUIT` |
| GET | `/api/redis/ping` | Liveness probe against the attached Redis. | `PING` |
| POST | `/api/redis/test-connection` | Validate ad-hoc credentials on a throwaway client. | `PING`, `QUIT` |
| GET | `/api/redis/keys` | List keys — paged `SCAN`, or blocking `KEYS` when `loadAll=true`. | `SCAN`/`KEYS`, `TYPE`, `TTL`, `STRLEN`/`HLEN`/`LLEN`/`SCARD`/`ZCARD` |
| DELETE | `/api/redis/keys` | Delete a single key. | `DEL` |
| GET | `/api/redis/keys/stream` | SSE progress load of all keys. **Reads the legacy singleton.** | `KEYS`, `TYPE`, `TTL`, size commands |
| POST | `/api/redis/keys/load-all` | Start a background full load, returns an `operationId`. | `KEYS`, `TYPE`, `TTL`, size commands |
| GET / POST / DELETE | `/api/redis/keys/status` | Read, write or drop progress for an `operationId`. | none |
| POST | `/api/redis/keys/cancel` | Flag a running operation cancelled. | none |
| DELETE | `/api/redis/keys/prefix` | Bulk-delete `prefix<sep>*` via a Lua script. | `EVAL` wrapping `SCAN` + `DEL` |
| GET | `/api/redis/value` | Read a key's value, TTL and size. | `TYPE`, `GET`/`HGETALL`/`LRANGE`/`SMEMBERS`/`ZRANGE …WITHSCORES`, `TTL`, `MEMORY USAGE` |
| PUT | `/api/redis/value` | Write a key and optionally its TTL. | `SET`/`SETEX`, `DEL`+`HSET`/`RPUSH`/`SADD`/`ZADD`, `EXPIRE` |
| POST | `/api/redis/command` | Raw CLI command from `/terminal`, via `redis.call(...)`. Splits on whitespace, so quoted args containing spaces break. | arbitrary |
| GET | `/api/redis/info` | Raw `INFO` text. | `INFO` |
| GET | `/api/redis/stats` | `INFO` flattened into a key/value object. | `INFO` |
| GET | `/api/redis/metrics` | Current derived metrics; also the module that boots the cleanup job. | `INFO` |
| GET | `/api/redis/metrics/history` | All twelve series for `period=1h\|6h\|12h\|24h`. | none (reads disk) |
| GET | `/api/redis/metrics/history/[metricName]` | One series. | none (reads disk) |
| GET | `/api/redis/monitor` | SSE live command feed on a `duplicate()`d client. | `MONITOR` |
| GET | `/api/redis/slowlog` | Slow queries sorted by duration desc, paginated. | `SLOWLOG GET 1000` |
| GET | `/api/redis/config` | Full config plus server, replication and persistence sections. | `CONFIG GET *`, `INFO server\|replication\|persistence` |
| POST | `/api/redis/config` | Change one config parameter. | `CONFIG SET` |
| GET | `/api/redis/maintenance` | Probe which maintenance commands the server supports. | `COMMAND INFO BGSAVE\|BGREWRITEAOF` |
| POST | `/api/redis/maintenance` | Run a maintenance operation. | `BGSAVE`, `BGREWRITEAOF`, `FLUSHDB`, `FLUSHALL` |

The key-loading strategies, their progress and cancellation semantics are explained in [Key Browser](key-browser.md); the metrics endpoints in [Metrics and Alerts](metrics.md).

## Notes for callers

- `POST /api/redis/maintenance` can `FLUSHALL`, `POST /api/redis/config` can rewrite server configuration, and `POST /api/redis/command` is unrestricted. None of the three verifies the `auth-token`.
- The `SCAN` branch of `GET /api/redis/keys` returns no cursor and no `total`; only the `loadAll` branch sets `total`. `redisClientService.getAllKeys` reads `result.total`, so a caller switching branches gets `undefined`.
- `POST /api/redis/keys/load-all` calls its own status endpoint over HTTP using `process.env.NEXTAUTH_URL || 'http://localhost:3000'`, which fails behind a proxy or on a non-3000 port.

Client wrappers for most of this live in `src/services/redis-client.ts` and `src/services/api/redis-api.ts` — prefer extending those over writing raw `fetch` calls in components.
