# Docker setup

## Env files (two layers)

| Layer                 | Purpose                                                                                                                                            |
| --------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Root `.env`**       | Used by `docker compose` for `${VAR}` substitution (ports, **build args** for `VITE_*` / `NEXT_PUBLIC_*`). Copy from `docker/compose.env.example`. |
| **Per-app env files** | Injected into containers at **runtime** (`env_file` in compose).                                                                                   |

### Per-app runtime files (must exist on your machine)

| Service               | File                              | Notes                                                                   |
| --------------------- | --------------------------------- | ----------------------------------------------------------------------- |
| `backend`             | `apps/backend/.env`               | DB, JWT, AWS, Paytm, paths, `CORS_ORIGIN`, `BACKEND_URL`, etc.          |
| `student-console`     | `apps/student-console/.env.local` | **Not** `.env` — Next uses `.env.local` locally; same file for Compose. |
| `notification-system` | `apps/notification-system/.env`   | Only if you start profile `notifications`.                              |

### Build-time vs runtime (important)

- **main-console**: `VITE_*` variables are embedded when the image is **built**. Set them in root `.env` before `docker compose build`. Changing them later requires a rebuild.
- **student-console**: `NEXT_PUBLIC_*` are embedded at **build**; server-only vars (`DATABASE_URL`, `JWT_*`, `ZEPTO_*`) come from `.env.local` at **runtime** via `env_file`.
- **backend**: all vars from `apps/backend/.env` at runtime.

### Browser vs Docker network URLs

Use **host** URLs in `VITE_*` / `NEXT_PUBLIC_*` (e.g. `http://localhost:8080`), not `http://backend:8080`. The user's browser runs outside Docker and cannot resolve service names.

Use **service names** only for server-to-server vars (e.g. `NOTIFICATION_SYSTEM_URL=http://notification-system:8091` on the backend container).

### Database on the host

If Postgres runs on your Mac/Windows host, set in `apps/backend/.env`:

```env
DATABASE_URL=postgresql://user:pass@host.docker.internal:5432/dbname
```

Same pattern for `apps/student-console/.env.local` if the Next server talks to Postgres directly.

## Commands

```bash
cp docker/compose.env.example .env
# Ensure apps/backend/.env and apps/student-console/.env.local exist

docker compose build
docker compose up -d

# Optional: local Postgres + notification worker
docker compose --profile db --profile notifications up -d
```
