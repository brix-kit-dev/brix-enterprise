# Super-admin E2E Suite (Phase 3 / C-5)

End-to-end Playwright suite that exercises the platform super-admin
journey against a **real** backend stack (Postgres + Redis + Spring Boot
host).  This is the regression net for v1.0 of the
*前端稳定性改造计划* (§5).

## Layout

```
e2e-tests/super-admin/
├─ docker-compose.yml          # Postgres + Redis (containerised)
├─ playwright.config.ts        # Playwright config (manages frontend dev-server)
├─ scripts/
│  └─ start-stack.ps1          # Starts Postgres, Redis, and the Spring Boot host
├─ tests/
│  ├─ constants.ts             # All ports, URLs, routes, event names
│  ├─ fixtures.ts              # Authenticated `superAdminPage` fixture
│  ├─ 01-platform-admin-login.spec.ts
│  ├─ 02-create-tenant.spec.ts
│  ├─ 03-invite-owner.spec.ts
│  ├─ 04-switch-view-mode.spec.ts
│  └─ 05-exit-view-mode.spec.ts
└─ package.json
```

## Prerequisites

* Node 20 + pnpm 8
* Docker Desktop (or any Docker daemon)
* JDK 21 + Maven (for the Spring Boot host)
* Playwright browsers — `pnpm run install-browsers`

## Local quick-start

```powershell
# 1) Start Postgres + Redis + backend (one-shot)
pnpm --filter @brix/super-admin-e2e run stack:up
pwsh ./scripts/start-stack.ps1   # boots the Spring Boot host

# 2) Run the suite (Playwright auto-starts the host-shell dev-server)
pnpm --filter @brix/super-admin-e2e run test

# 3) Tear down
pnpm --filter @brix/super-admin-e2e run stack:down
```

## CI

The suite runs on `main` pushes and a nightly schedule via
`.github/workflows/e2e.yml`.  Main-push runs remain advisory and publish the
Playwright report as an artifact on failure. Nightly scheduled runs are
blocking now that Phase 3 selectors are stabilized on `data-testid`.

## Conventions

* **No magic strings** — every URL, port, route, and event name lives in
  `tests/constants.ts`.
* **No direct backend writes** — tests interact through the UI only.
* **Selector strategy** — use `data-testid` only for E2E-controlled actions.
* **Storage state** — login happens once per worker, persisted in
  `.auth/super-admin.json` (gitignored).
