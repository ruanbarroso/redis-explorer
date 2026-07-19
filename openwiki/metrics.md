---
type: concept
title: Metrics and Alerts
description: How Redis Explorer derives metrics from INFO, the twelve chartable series, the per-connection JSON history files with their retention and cleanup job, and the alert thresholds driving the dashboard.
resource: src/services/metrics.ts
tags: [metrics, monitoring, alerts, time-series, dashboard]
timestamp: 2026-07-19T10:31:24Z
---

# Metrics and Alerts

Everything shown on `/dashboard`, `/alerts` and `/monitor` derives from Redis `INFO` output. There is no external time-series database — history is JSON files on the same volume as connections.

## Derivation

`MetricsService.calculateMetrics(stats, sessionId, connectionId)` in `src/services/metrics.ts` turns an `INFO` snapshot into metrics. It keeps a per-session `Map<sessionId, { previousStats, previousTimestamp }>` so rate-style values are **true deltas over actual elapsed time** (defaulting to a 5-second assumption on the first sample). CPU percentage is clamped to 0–100.

`src/types/metrics-history.ts` defines `CHARTABLE_METRICS`, the twelve series with title, unit and colour:

`cacheHitRatio`, `memoryUsagePercentage`, `memoryFragmentationRatio`, `cpuPercentage`, `latencyP50`, `latencyP95`, `opsPerSec`, `connectedClients`, `evictedPerSec`, `expiredPerSec`, `networkInputKbps`, `networkOutputKbps`.

The `stats` Redux slice computes fallbacks when Redis does not report a value directly: CPU from `used_cpu_sys / uptime_in_seconds`, and p50/p95 latency from slow-log durations converted µs → ms. Be aware that its `evictionsPerSec`, `expiredPerSec` and `rejectedConnPerSec` divide **cumulative counters** by a hardcoded interval of 5 rather than differencing successive samples, so those three slice values are not real rates. The server-side `MetricsService` versions are correct; prefer them.

## Sampling

Sampling is driven entirely by the client. `MetricsProvider` (`src/contexts/MetricsContext.tsx`) runs a self-rescheduling loop that calls `GET /api/redis/metrics` and schedules the next call **2 seconds** after the previous one completes, under a 5-second `AbortController` timeout. The provider is mounted in `src/app/(app)/layout.tsx`, so it polls on every authenticated page, not just the dashboard.

The server applies **no write throttle** — every poll appends a point to every series.

## Storage and retention

`src/services/metrics-storage.ts` writes one flat JSON file per connection:

```
${REDIS_EXPLORER_DATA_DIR || cwd}/data/metrics/metrics-<connectionId>.json
{ "<metricName>": [ { "timestamp": ..., "value": ... }, ... ] }
```

Written with synchronous `fs.writeFileSync` and pretty-printed `JSON.stringify(..., null, 2)`, meaning each append is a full read-modify-write of the entire file. Retention is applied inline on every append: `MAX_AGE_MS = 24h` and `MAX_POINTS_PER_METRIC = 1440` via `slice(-1440)`.

**Those two limits disagree in practice.** 1440 points was chosen to mean one point per minute for 24 hours, but at the actual 2-second poll cadence the cap is reached in roughly 48 minutes. Charts labelled `24h` cannot show 24 hours of data. Fixing this means throttling the server-side write, not raising the cap — raising it makes the synchronous full-file rewrite worse.

`src/services/metrics-cleanup-job.ts` sweeps all connections once at startup and hourly thereafter. It is started by the side-effect module `src/lib/init-server.ts`, which is imported only by `src/app/api/redis/metrics/route.ts` — so the job does not begin until the first metrics request arrives. `deleteConnectionMetrics(connectionId)` exists for manual purge.

## Reading history

- `GET /api/redis/metrics/history?period=1h|6h|12h|24h` — all series.
- `GET /api/redis/metrics/history/[metricName]` — one series.

Both resolve the connection id from the `redis-explorer-session` cookie through the session manager, exactly like every other Redis route (see [Architecture](architecture.md)), so history is scoped to whatever connection the caller is currently attached to.

Rendering is Recharts, via `src/components/MetricChartModal.tsx` (opened from a `MetricCard`) and the `useMetricHistory` hook.

## Alerts

`src/constants/thresholds.ts` holds the threshold table; `src/hooks/useAlerts.ts` evaluates current metrics against it and produces severity-tagged alerts, rendered by `src/components/Alerts.tsx` on `/alerts`, summarised by `AlertBanner`, and counted in a `Badge` on the drawer nav item in `src/app/(app)/layout.tsx`. Memory fragmentation, p95 latency and cache hit ratio are the main drivers. When adjusting a threshold, change it in `thresholds.ts` only — the dashboard cards read the same constants, and commit `abf4217` exists precisely to keep the panel and the alerts aligned.

## Related surfaces

`GET /api/redis/monitor` streams live Redis commands over SSE using a `duplicate()`d client running `MONITOR`, rendered by `src/components/Monitor.tsx`. `GET /api/redis/slowlog` returns `SLOWLOG GET 1000` sorted by duration descending and paginated. Both are listed in [API Reference](api-reference.md).

One caution when reading `src/services/redis.ts`: its `getStats` **fabricates command statistics** when Redis returns an empty `commandstats` section, inventing plausible `INFO`/`PING`/`GET`/`SET` rows from percentages of `total_commands_processed`. Its `avgTtl` is also `totalExpires / totalKeys`, a ratio of counts rather than an average TTL. Do not trust either value; both are catalogued in [Known Issues](known-issues.md).
