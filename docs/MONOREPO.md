# Academic360 monorepo (pnpm + Turborepo)

This repo uses **pnpm workspaces** for linking and **Turborepo** for task orchestration and caching. Apps live under `apps/`, shared code under `packages/`.

## Layout

| Package                       | Name                      | Role                                                              |
| ----------------------------- | ------------------------- | ----------------------------------------------------------------- |
| `apps/backend`                | `backend`                 | Express API (Node ESM, `tsc` → `dist/`)                           |
| `apps/main-console`           | `main-console`            | Admin UI (Vite + React)                                           |
| `apps/student-console`        | `student-console`         | Student UI (Next.js 15, `output: "standalone"`)                   |
| `apps/notification-system`    | `notification-system`     | Notifications service                                             |
| `apps/student-console-mobile` | `student-console-mobile`  | Expo (no `build` task; not in Docker yet)                         |
| `packages/db`                 | `@repo/db`                | Drizzle schemas, DTOs, types (**must be built** before Node apps) |
| `packages/utils`              | `@repo/utils`             | Shared TS utilities (source-only; transpiled by consumers)        |
| `packages/ui`                 | `@repo/ui`                | Shared UI (minimal usage today)                                   |
| `packages/eslint-config`      | `@repo/eslint-config`     | ESLint flat configs                                               |
| `packages/typescript-config`  | `@repo/typescript-config` | Shared `tsconfig` bases                                           |

## How linking works today

### pnpm `workspace:*`

Apps declare `"@repo/db": "workspace:*"`. pnpm symlinks `node_modules/@repo/db` → `packages/db`.

### Two ways `@repo/db` is resolved (important)

1. **Package exports** (`packages/db/package.json` → `./dist/...`) — correct for **Node runtime** and production Docker after `pnpm run build` in `@repo/db`.
2. **TypeScript `paths`** in app `tsconfig` → `../../packages/db/src/*` — used for **editor + `tsc`/Vite** so you do not need a rebuild on every schema change.

**Vite (`main-console`)** resolves types via `paths` and bundles from **source** at build time.

**Backend** currently **`include`s `packages/db/src`** in `apps/backend/tsconfig.json`, so `tsc` emits a **copy of db under** `apps/backend/dist/packages/db/...` in addition to building `@repo/db` separately. That duplicates work but “works”; the long-term fix is: backend only imports `@repo/db` as a package (no `include` of db source).

### `@repo/utils`

No `build` script. Next.js uses `transpilePackages: ["@repo/utils"]`; backend uses `paths` to `packages/utils/src`. Exports must point at real files (see `package.json`).

## Turborepo

Root `turbo.json`:

- `build` has `"dependsOn": ["^build"]` so **`@repo/db` builds before** apps that depend on it.
- Outputs: `dist/**`, `.next/**` (excluding `.next/cache`).

Run from repo root:

```bash
pnpm install
pnpm build                    # all packages with a build script
pnpm turbo build --filter=backend...
pnpm turbo build --filter=main-console...
```

Package names for `--filter` match `name` in each `package.json` (`backend`, `main-console`, `@repo/db`, etc.).

### Packages without a `build` script

`@repo/eslint-config`, `@repo/typescript-config`, `@repo/ui`, `@repo/utils`, `student-console-mobile` — Turbo skips them for `build`; `^build` does not block dependents.

## Root `package.json` caveat

Many runtime dependencies are hoisted on the **root** `package.json`. That is **not** the usual Turborepo pattern (deps should live on the app/package that uses them). It can still work because pnpm hoists, but it:

- Inflates install size in Docker
- Hides which app owns which dependency

**Recommendation:** gradually move dependencies from root into the relevant `apps/*` or `packages/*` `package.json` files.

The root `"workspaces"` array is **ignored by pnpm**; only `pnpm-workspace.yaml` defines workspaces.

## Docker (Turborepo `prune`)

Official flow: [Docker guide](https://turbo.build/repo/docs/guides/tools/docker)

1. `turbo prune --scope=<app> --docker` → `out/json` (lockfile + package.jsons) + `out/full` (sources).
2. `pnpm install --frozen-lockfile` in a slim image.
3. `pnpm turbo run build --filter=<app>...` builds the app and workspace dependencies.

See **`docker/README.md`** for full env + Compose instructions.

```bash
cp docker/compose.env.example .env    # build args + ports (repo root)
docker compose build
docker compose up -d
```

### Env files (what Compose uses)

| Service           | Runtime `env_file`                                 | Build-time vars (root `.env` → build `args`)                                                                                         |
| ----------------- | -------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------ |
| `backend`         | `apps/backend/.env`                                | —                                                                                                                                    |
| `main-console`    | —                                                  | `VITE_APP_BACKEND_URL`, `VITE_APP_STUDENT_CONSOLE_URL`, `VITE_STUDENT_PROFILE_URL`, `VITE_STUDENT_IMAGE_BASE_URL`, `VITE_APP_PREFIX` |
| `student-console` | `apps/student-console/.env.local` (**not** `.env`) | `NEXT_PUBLIC_APP_ENV`, `NEXT_PUBLIC_API_URL`, `NEXT_PUBLIC_URL`                                                                      |

Use **localhost** URLs in `VITE_*` / `NEXT_PUBLIC_*` (browser-facing). Use **service names** only in server env (e.g. `NOTIFICATION_SYSTEM_URL=http://notification-system:8091` in `apps/backend/.env` when using `--profile notifications`).

Optional profiles: `db` (Postgres), `notifications` (notification-system).

### Per-app artifacts

| App                   | Dockerfile                            | Entry / artifacts                     |
| --------------------- | ------------------------------------- | ------------------------------------- |
| `backend`             | `apps/backend/Dockerfile`             | `node dist/apps/backend/src/index.js` |
| `main-console`        | `apps/main-console/Dockerfile`        | Static `dist/` via `serve`            |
| `student-console`     | `apps/student-console/Dockerfile`     | Next **standalone**                   |
| `notification-system` | `apps/notification-system/Dockerfile` | profile `notifications` only          |

## Version alignment

- Root: `"packageManager": "pnpm@10.33.2"` (authoritative).
- `pnpm.overrides` pins `drizzle-orm` for the whole repo.
- Prefer `pnpm-workspace.yaml` `catalog:` for shared versions (see file).

## Checklist before production Docker

- [ ] `pnpm build` green at repo root
- [ ] Backend `.env` / DB secrets provided to Compose
- [ ] Root `.env` from `docker/compose.env.example` (VITE / NEXT_PUBLIC build args)
- [ ] `apps/backend/.env` and `apps/student-console/.env.local` present
- [ ] Rebuild frontends after changing `VITE_*` or `NEXT_PUBLIC_*`
- [ ] Run DB migrations (`backend` `db:migrate`) as a separate job or init container

## Future improvements

1. Stop compiling `packages/db/src` inside `apps/backend` (`include` removal).
2. Add `build` + `exports` for `@repo/utils` (mirror `@repo/db`).
3. Complete `@repo/db` `exports` map or document allowed import paths.
4. Add `notification-system` service to Compose when ready.
5. Move root dependencies into leaf packages.
