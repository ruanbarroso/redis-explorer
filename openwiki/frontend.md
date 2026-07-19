---
type: concept
title: Frontend
description: Redis Explorer's page routes and redirect flow, the four Redux Toolkit slices and what each holds, the provider tree, and the hardcoded MUI dark theme.
resource: src/store/index.ts
tags: [frontend, react, redux, mui, routing, theme]
timestamp: 2026-07-19T10:31:24Z
---

# Frontend

React 19 client components on the Next.js App Router, with Redux Toolkit for shared state and MUI v6 for the UI.

## Route map

| Route | File | Behaviour |
| --- | --- | --- |
| `/` | `src/app/page.tsx` | Redirect hub. No password → `/setup`; not authenticated → `/login`; no active connection → `/connections`; else `/dashboard`. Shows `LoadingScreen` while deciding. |
| `/setup` | `src/app/(auth)/setup/page.tsx` | First-run password creation; redirects away if one already exists. |
| `/login` | `src/app/(auth)/login/page.tsx` | `LoginForm`; on success calls `refreshAuth()` then pushes `/connections`. |
| `/connections` | `src/app/connections/page.tsx` | `ConnectionSelector`. Sits outside both route groups, so it renders without the app chrome. |
| `/dashboard` | `src/app/(app)/dashboard/page.tsx` | Metric cards and charts. |
| `/browser` | `src/app/(app)/browser/page.tsx` | `KeysBrowser`. |
| `/browser/edit/[key]` | `src/app/(app)/browser/edit/[key]/page.tsx` | Decodes the URL key, dispatches `setSelectedKey` + `fetchValue`, renders `ValueEditor`. |
| `/alerts` | `src/app/(app)/alerts/page.tsx` | Threshold-driven alert list. |
| `/monitor` | `src/app/(app)/monitor/page.tsx` | Live `MONITOR` stream. |
| `/slowlog` | `src/app/(app)/slowlog/page.tsx` | Slow query table. |
| `/terminal` | `src/app/(app)/terminal/page.tsx` | Redis CLI with command history. |
| `/settings` | `src/app/(app)/settings/page.tsx` | Application settings, including the SCAN count. |

Route protection is entirely these client-side redirects plus per-page `useEffect` guards — see [Authentication](authentication.md) for why that matters.

## Provider tree

`src/app/layout.tsx` loads the Inter font and renders `Providers` (`src/components/Providers.tsx`):

```
redux Provider
  └─ EmotionCacheProvider      src/lib/emotion-cache.tsx (SSR-safe cache)
       └─ ThemeProvider + CssBaseline
            └─ AuthProvider    src/contexts/AuthContext.tsx
```

`src/app/(app)/layout.tsx` adds `MetricsProvider` (which starts the polling loop described in [Metrics and Alerts](metrics.md)) and the shell: a fixed `AppBar`, a 240 px `Drawer` with seven nav items and an alert `Badge`, plus `ConnectionSwitcher`, `AuthModals`, `ConnectionDialog` and `useCrossTabSync`.

`src/app/(auth)/layout.tsx` re-declares `EmotionCacheProvider`, `ThemeProvider` and `CssBaseline` inside a root layout that already supplies all three. The duplication is harmless but confusing — do not copy the pattern.

## Store

`src/store/index.ts` is a plain `configureStore` with four reducers. `serializableCheck.ignoredActions` lists `persist/PERSIST`, but redux-persist is not a dependency; all persistence is hand-rolled `localStorage`.

- **`connection`** — `connections[]`, `activeConnection` (mirrored to `localStorage` under `redis-explorer-active-connection`), `isConnecting`, `error`. Thunks: `loadConnections`, `saveConnection`, `updateConnectionOnServer`, `removeConnectionFromServer`, `migrateFromLocalStorage`, `connectToRedis`, `disconnectFromRedis`, `testConnection`. Behaviour in [Connections](connections.md).
- **`keys`** — `keys[]`, `selectedKey`, `selectedValue`, `searchPattern` (default `'*'`), loading flags, `totalKeys`, `viewMode` (`'list' | 'tree'`, default `'tree'`), `treeExpandedNodes`, `loadingProgress`, `loadedKeysJson`, `error`. Includes `decrementTTLs`, `removeExpiredKeys` and `removeKeysLocally` for the live TTL countdown and optimistic bulk delete described in [Key Browser](key-browser.md).
- **`stats`** — `stats`, `info`, `slowLog[]`, `derivedCpuPercent`, `lastUpdated`, `clientRttP50/P95`, and per-second counters. Its rate derivations have a known flaw, noted in [Metrics and Alerts](metrics.md).
- **`browserSettings`** — `keysToScan` (default 1000), persisted to `localStorage` under `redis-explorer-browser-settings`. This is the `SCAN COUNT` exposed on `/settings`.

## Theme and styling

`src/theme/index.ts` defines a **single hardcoded dark theme** — there is no light mode and no toggle. A GitHub-dark palette (`background.default #0d1117`, `paper #161b22`, `text.primary #f0f6fc`) with a Redis-red primary `#dc382d`, custom scrollbars via `MuiCssBaseline`, and overrides for `MuiPaper` (gradient removed), `MuiAppBar`, `MuiDrawer`, `MuiListItem`, `MuiButton` (no uppercase, radius 6) and `MuiTextField`.

Note a genuine inconsistency: `/login`, `/setup` and `/connections` use Tailwind-style utility class strings such as `bg-gray-100` and `text-2xl font-bold`, but **Tailwind is not a dependency**. Those classes are inert. If you restyle those pages, convert them to MUI `sx` rather than adding Tailwind.

Other notable libraries in use: `@monaco-editor/react` in `ValueEditor`, `recharts` in `MetricChartModal`, `@mui/x-data-grid`, `react-json-view`, `date-fns` and `lodash`. `socket.io` and `socket.io-client` are dependencies, but the live feeds documented in [API Reference](api-reference.md) are implemented with Server-Sent Events, not sockets.
