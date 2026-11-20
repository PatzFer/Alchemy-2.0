# Alchemy 1.0 — Deployment and Preview Gate

Status: preparation only; no hosting provider or Supabase project is connected.
Branch: `build/phase-2-planner`
Last reviewed: 18 November 2026

## Current application shape

- One long-running Node/Express process serves the API and the built Vite client.
- Production startup runs `node dist/server.cjs`.
- The server binds to `0.0.0.0` and reads `PORT`.
- The client still persists its application state in browser localStorage.
- Authentication, passkey/TOTP credentials, sessions and integration status are currently held in server process memory.
- `/api/health` is a liveness check only.
- `/api/ready` deliberately returns HTTP 503 until durable identity/session storage, durable integration storage and encrypted app-state persistence are implemented and verified.

## Do not publish a public preview yet

A public deployment at this stage would create a misleading impression of security. In-memory authentication state can disappear on restart or differ between multiple server instances. Browser localStorage is not encrypted and does not synchronize between devices. Do not expose real private, health, cycle, financial or Mariluna client data to this build.

A local developer preview is suitable only with synthetic/test data and a private device/network.

## Preview authentication for local testing

- The client checks the server session before showing any workspace.
- In local development only, setting `ENABLE_PREVIEW_AUTH=true` enables the existing server-side preview-unlock route.
- The route explicitly returns 404 when the flag is absent or when `NODE_ENV=production`.
- This is a convenience for synthetic-data testing, not real account authentication. The session vault is in-memory and may reset when the server restarts.
- Never use preview mode with real personal, health, cycle, financial or Mariluna client data. Production requires real passkey/TOTP/recovery authentication and durable identity storage.

## Environment variables

The checked-in `.env.example` contains blank placeholders. Configure real values only in the hosting provider's secret manager, never in Git.

Required only after the corresponding integrations are implemented:
- `GEMINI_API_KEY`: server-side Gemini API key.
- `APP_URL`: canonical HTTPS application origin.
- `SUPABASE_URL` and `SUPABASE_ANON_KEY`: Supabase project configuration.
- `SUPABASE_SERVICE_ROLE_KEY`: server-only privileged key; never use a `VITE_` prefix.
- `APP_ENCRYPTION_KEY`: server-side encryption key or KMS integration.

Presence of these variables alone does not mean that persistence or authentication works. The server must verify JWTs, derive the owner from the verified subject, use RLS correctly, persist sessions and credentials, and pass restore/isolation tests.

## Safe preview acceptance gate

Before creating a public preview:
1. Implement Supabase Auth owner bootstrap with no public first-user-wins endpoint.
2. Replace in-memory sessions, passkeys, TOTP, recovery-code and rate-limit storage with durable owner-scoped storage.
3. Implement server-side token verification and session revocation.
4. Move app-state reads/writes to owner-scoped snapshots with concurrency/revision checks.
5. Encrypt TOTP and integration tokens server-side using a key outside Postgres.
6. Run migration, RLS isolation, restart, backup and restore tests in a staging Supabase project.
7. Confirm that production readiness returns success only after all required persistence adapters pass an actual connectivity/permission probe.
8. Test the app with synthetic data on Android and desktop before inviting the owner to use it.

## Build and run commands

- Install pinned dependencies: `bun install --frozen-lockfile`
- TypeScript: `bun run lint`
- Tests: `bun run test`
- Migration static checks: `bun run check:supabase`
- Production build: `bun run build`
- Start production server: `bun run start`

These commands validate the code/build pipeline. They do not provision a database or make the app production-ready.
