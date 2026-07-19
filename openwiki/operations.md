---
type: concept
title: Operations
description: Deploying Redis Explorer with Docker, Compose or Kubernetes, the environment variables that actually matter, the persistent data volume, and the CI and semantic-release pipeline.
resource: Dockerfile
tags: [deployment, docker, kubernetes, ci, release, configuration]
timestamp: 2026-07-19T10:31:24Z
---

# Operations

## Environment variables

Only the variables below are read by the code. `.env.example` also lists `NEXTAUTH_SECRET`, `NEXT_PUBLIC_GA_ID`, `SENTRY_DSN` and several feature flags that **nothing in `src/` reads** — ignore them.

| Variable | Effect | Default if unset |
| --- | --- | --- |
| `JWT_SECRET` | Signs the `auth-token` JWT. | **A hardcoded literal.** Always set this. |
| `REDIS_EXPLORER_KEY` | AES key material for stored Redis passwords. | **A hardcoded literal.** Always set this. |
| `REDIS_EXPLORER_DATA_DIR` | Overrides where connections and metrics are written. | Per-platform user data dir. |
| `FORCE_HTTPS` | Force the `Secure` cookie flag on. | Derived from request protocol. |
| `DISABLE_SECURE_COOKIE` | Force it off. | Derived from request protocol. |
| `NEXTAUTH_URL` | Base URL the `keys/load-all` route uses to call itself. | `http://localhost:3000`. |
| `NODE_ENV`, `PORT`, `HOSTNAME` | Standard Next.js runtime settings. | — |

`REDIS_URL`, `REDIS_HOST`, `REDIS_PORT`, `REDIS_PASSWORD` and `REDIS_DATABASE` appear in `.env.example` and in `docker-compose.yml`, and `README.md` presents `REDIS_URL` as configuring a default connection. **No code reads any of them.** Redis targets are defined exclusively through the UI and persisted as described in [Connections](connections.md).

The two hardcoded defaults are the operational priority here; their consequences are spelled out in [Authentication](authentication.md) and [Connections](connections.md).

## Persistent data

One directory holds all mutable state:

- `auth.json` — the bcrypt password hash (written relative to `process.cwd()`).
- `redis-explorer/connections.json` — connection definitions with encrypted passwords.
- `metrics/metrics-<connectionId>.json` — metric history.

Losing it means losing your connections and re-entering first-run setup. Mount a volume:

```bash
docker run -d -p 3000:3000 -v redis-explorer-data:/app/data ruanbarroso/redis-explorer:latest
```

**`data/` is not listed in `.gitignore`**, and runtime state has been committed to the repository as a result. Never `git add` anything under it, and rotate the admin password on any clone whose history you do not control.

## Docker

`Dockerfile` is a four-stage `node:22-alpine` build (`base` → `deps` → `builder` → `runner`) that auto-detects the yarn, npm or pnpm lockfile. It relies on `output: 'standalone'` from `next.config.js` and runs `node server.js` as a non-root `nextjs:nodejs` user (uid/gid 1001). It exposes 3000 and sets `PORT=3000`, `HOSTNAME=0.0.0.0`, `NODE_ENV=production`, `NEXT_TELEMETRY_DISABLED=1`, `REDIS_EXPLORER_DATA_DIR=/app/data`, plus `VOLUME ["/app/data"]`.

`next.config.js` sets `eslint.ignoreDuringBuilds: true` **and** `typescript.ignoreBuildErrors: true`. A Docker build therefore succeeds with type errors in the tree — run `yarn type-check` yourself before shipping.

`docker-compose.yml` starts the app plus two Redis servers for local work: a plain `redis:7-alpine` on 6379 and one with `--requirepass` on 6380, on a bridge network `redis-network`, with a named volume for `/app/data`. The compose file pins a literal dev password for the second server, which is fine for local use and must not be copied anywhere real. Its `version: '3.8'` key is obsolete in current Compose.

## Kubernetes

`k8s/` contains four manifests:

- `deployment.yaml` — 1 replica of `ruanbarroso/redis-explorer:latest`, container port 3000, `/app/data` from the PVC, requests 256Mi/100m and limits 512Mi/500m, liveness and readiness probes on `/`.
- `service.yaml` — `NodePort` on 3000.
- `pvc.yaml` — 1 Gi `ReadWriteOnce`, `storageClassName: hostpath`.
- `ingress.yaml` — nginx class, host `redis-explorer.local`, rewrite-target `/`.

Four caveats before using these as-is: `JWT_SECRET` and `REDIS_EXPLORER_KEY` are not set, so the hardcoded defaults ship; the `:latest` tag with no `imagePullPolicy` makes rollouts non-deterministic; `storageClassName: hostpath` is Docker-Desktop-specific; and `ReadWriteOnce` plus the in-memory session pool from [Architecture](architecture.md) caps this at exactly one replica.

The probes hit `/`, which is the client-side redirect hub from [Frontend](frontend.md) — they verify the Node process is up, not that Redis is reachable. `GET /api/redis/ping` would be a real readiness signal, though it requires an attached session.

## CI and releases

`.github/workflows/ci.yml` runs on a Node version matrix: `yarn install --frozen-lockfile`, `yarn type-check`, `yarn lint --max-warnings=10`, `yarn test --passWithNoTests`, `yarn build`, Codecov upload, plus a security job running `yarn audit --level high` and Snyk. Because only two test files exist (see [Quickstart](quickstart.md)), a green CI run says the code compiles, not that it works.

`.releaserc.json` drives semantic-release from `main` using conventional commits: `feat` → minor, `fix`/`perf`/`revert`/`refactor` → patch, breaking → major, and `docs`/`style`/`chore`/`test`/`build`/`ci` → no release. Release notes append Docker pull commands automatically. **Commit messages therefore determine version bumps** — use conventional prefixes, and note that `chore(release): x.y.z [skip ci]` commits in the history are machine-generated.

Release notes and `README.md` still advertise `linux/amd64` only, and `README.md` marks arm64 as "coming soon", but commit `5ede5a1` added multi-architecture amd64/arm64 builds. The docs lag the pipeline here — see [Known Issues](known-issues.md).
