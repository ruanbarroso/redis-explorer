---
type: concept
title: Key Browser
description: How Redis Explorer discovers keys via SCAN and KEYS, the three competing load strategies with their progress and cancellation models, separator auto-detection, tree building, and bulk prefix deletion.
resource: src/app/api/redis/keys/route.ts
tags: [keys, scan, tree-view, separator, streaming, bulk-delete]
timestamp: 2026-07-19T10:31:24Z
---

# Key Browser

The `/browser` page is the largest feature in the app. It has three separate server-side key-loading strategies and a client-side tree layer on top.

## Loading keys

### Paged SCAN — `GET /api/redis/keys`

The default path. A cursor loop issuing `SCAN <cursor> MATCH <pattern> COUNT <scanCount>`, with `scanCount` defaulting to 1000 and a requested result `count` defaulting to 100. It stops on cursor `'0'`, on reaching `count`, or on a hard `maxIterations = 100` safety cap.

`scanCount` is user-tunable: the `browserSettings` slice persists `keysToScan` to `localStorage` and `src/components/Settings.tsx` exposes it, so operators can trade round trips against blocking on large keyspaces.

**The cursor is never returned to the client.** There is consequently no real pagination — a second page is unreachable and the browser re-scans from cursor 0 on every request. Any pagination work has to start by threading the cursor through the response.

### Whole-keyspace load

Everything that claims to load "all" keys uses the blocking `KEYS <pattern>` command, not `SCAN`:

- `GET /api/redis/keys?loadAll=true`
- `GET /api/redis/keys/stream`
- `POST /api/redis/keys/load-all`
- `redisService.getAllKeys` in `src/services/redis.ts`

On a large production keyspace this blocks the Redis server. The "Use SCAN instead of KEYS for better performance" comment in `src/services/redis.ts` applies only to the paged `getKeys`, not to these.

### Streaming — `GET /api/redis/keys/stream`

Server-Sent Events. Emits `{ type: 'progress' | 'complete' | 'error', phase, progress, total, current }` frames, scaling progress from 10 % to 95 % across batches of 1000 keys, then a final `complete` frame carrying the entire key array. It has **no cancellation**, and it reads from the legacy `redisService` singleton rather than the session pool — so it fails for any client that connected via `/connect-session`, which is all of them. See [Architecture](architecture.md).

### Background load with polling — `POST /api/redis/keys/load-all`

The strategy with working cancellation. It starts `processKeysInBackground` **without awaiting it**, returns immediately with an `operationId`, and writes progress into a process-global `operationStatus` map. The client then polls:

- `GET /api/redis/keys/status` — read progress.
- `POST /api/redis/keys/cancel` — set `{ status: 'cancelled' }`; the worker checks this once per 1000-key batch.

Completed and errored entries are purged after five minutes. Consumed client-side by `useLoadAllKeysWithProgress` and `useLoadAllKeysWithPolling`, surfaced by `LoadingProgressModal`.

Two structural caveats: the status map is per-process, so this breaks under multiple workers; and because work continues after the response returns, a serverless or auto-freezing runtime can strand an operation permanently at `running`.

### Per-key enrichment

Every strategy enriches each key with `TYPE` + `TTL` + a type-specific size command (`STRLEN`, `HLEN`, `LLEN`, `SCARD`, `ZCARD`). That is **three round trips per key**, with no pipelining, parallelised only by `Promise.all` over batches. This dominates the cost of loading a large keyspace and is the obvious optimisation target — `pipeline()` would collapse it.

## Separator detection and the tree

`src/utils/treeBuilder.ts` splits `key.name` on a separator to build a nested `TreeNode[]`, where node ids are accumulated paths. Folders sort before leaves, then `localeCompare`. A path that is simultaneously a leaf and a prefix is promoted to a folder, dropping its `keyData`.

`TreeBuilder.detectSeparator` scores candidates `['::', ':', '/', '.', '-', '_', '|']` with weights `10, 5, 3, 2, 1, 1, 2`:

```
score = consistencyRatio × min(avgOccurrences, 5) × weight
```

The `min(..., 5)` cap exists specifically to stop `-` winning on keysets full of UUIDs. Occurrences of `:` that are part of `::` are excluded from the `:` count, and any presence of `::` short-circuits to `'::'`. Ties break toward the longer separator; the default is `':'`.

`src/hooks/useTreeView.ts` memoizes detection and tree construction, and lets `customSeparator` (driven by `src/components/SeparatorSelector.tsx`) override the detected value. Expansion state lives in Redux as `keys.treeExpandedNodes`, converted to a `Set` for lookup, with `expandAll`, `collapseAll`, `expandToKey`, `expandAllChildren` and `collapseAllChildren` helpers.

**Known bug**: `TreeBuilder.searchInTree` hardcodes `':'` when splitting a full path to derive ancestor ids, ignoring the active separator. Search-driven expansion therefore computes wrong parent ids for any non-`:` keyspace.

## Rendering

`src/components/TreeView.tsx` is **not virtualized** — it renders the full nested MUI `List`/`Collapse` recursively, so very wide trees are slow. Only the flat list mode is virtualized, by a hand-rolled implementation in `src/components/VirtualizedKeysList.tsx` (fixed `ITEM_HEIGHT = 72`, `BUFFER_SIZE = 5`, sliced by `scrollTop`). Both `react-window` and `react-virtualized` are dependencies in `package.json` and neither is used here.

`useTTLCountdown` ticks the `decrementTTLs` and `removeExpiredKeys` reducers so displayed TTLs count down live without re-fetching.

## Values and deletion

`GET/PUT /api/redis/value` reads and writes all five supported types, plus TTL via `EXPIRE`, and reports size with `MEMORY USAGE`. `src/components/ValueEditor.tsx` renders it — Monaco for strings, tabular editors for the collection types.

`DELETE /api/redis/keys/prefix` implements bulk delete: a Lua script run with `EVAL` that scans and deletes `prefix<separator>*`. Two constraints — it uses `unpack(keys)`, so batch size is bounded by the Lua stack limit, and it passes `numkeys = 0` while touching keys, which breaks on Redis Cluster. The client applies `removeKeysLocally` optimistically. Single-key deletion is `DELETE /api/redis/keys`.

Full endpoint list in [API Reference](api-reference.md); the remaining divergences are collected in [Known Issues](known-issues.md).
