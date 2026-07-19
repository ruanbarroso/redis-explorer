---
okf_version: "0.1"
---

# Files

- [Quickstart](quickstart.md) - What Redis Explorer is, how to run it locally, and where to go next.
- [Architecture](architecture.md) - How the Next.js App Router frontend, the API route layer, and the server-side Redis session layer fit together.
- [Authentication](authentication.md) - The single shared-password login, the JWT auth cookie, the session cookie, and what is actually enforced.
- [Connections](connections.md) - How Redis connections are defined, persisted on disk, pooled per session, and switched at runtime.
- [Key Browser](key-browser.md) - Key discovery via SCAN and KEYS, the streaming and background load-all flows, tree building, and separator detection.
- [Metrics and Alerts](metrics.md) - Metric derivation from INFO, the per-connection history files, retention, and the alert thresholds.
- [API Reference](api-reference.md) - Catalog of every HTTP route under /api with method, purpose, and the Redis commands it issues.
- [Frontend](frontend.md) - Page routes, the Redux store slices, the provider tree, and the MUI dark theme.
- [Operations](operations.md) - Docker, Docker Compose, Kubernetes, environment variables, CI, and the semantic-release pipeline.
- [Known Issues](known-issues.md) - Verified divergences between docs and code, dead code, and traps that will cost you an afternoon.
