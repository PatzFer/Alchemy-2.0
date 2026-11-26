# Alchemy 1.0 — Supabase and Render setup checklist

Status: preparation only. No Supabase project is provisioned or connected.
Development branch: `main`. Do not apply migrations to production until the staging checks below pass.

## 1. Create the Supabase project

1. Create a Supabase project in your own account. Choose a region close to Belgium/EU users.
2. Save the database password in your password manager. It is not an application environment variable.
3. In Project Settings → API (or API Keys), collect:
   - Project URL
   - Publishable/anon key
   - Secret/service-role key (server only)
4. In Authentication → URL Configuration, set the production Site URL to the exact Render HTTPS origin and add the required callback URLs once the app's Supabase Auth callback route is implemented.
5. Keep public sign-up disabled. Provision the single owner through the Supabase dashboard/invite flow; do not expose an unauthenticated first-user-wins endpoint.

## 2. Apply database migrations safely

- Apply the checked-in SQL migrations to a new staging project first, in timestamp order.
- Confirm RLS is enabled and the browser roles cannot read credential/session/token tables or snapshots directly.
- Run the repository migration checks and the full test/build pipeline.
- Verify owner isolation with two test users, restart/session-revocation behavior, snapshot read-after-write, revision conflicts, backup and restore.
- Do not import real personal or Mariluna data until a verified export and restore drill exists.
- Never run a migration manually against a production database without a current backup and reviewed diff.

## 3. Render environment variables

Add these under the Render service's Environment settings. Use secret values from Supabase and keep all secret keys server-side.

| Variable | Value / purpose |
|---|---|
| `SUPABASE_URL` | Supabase Project URL |
| `SUPABASE_ANON_KEY` | Supabase publishable/anon key |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase secret/service-role key; server only, never `VITE_*` |
| `SUPABASE_OWNER_EMAIL` | Exact email address of the one owner account provisioned in Supabase Auth |
| `SUPABASE_AUTH_REQUIRED` | Set to `true` only after Supabase Auth and all required environment variables/migrations have been verified; otherwise omit during migration |
| `APP_ENCRYPTION_KEY` | Base64-encoded random 32-byte key (generate once, store securely, back it up) |
| `APP_ENCRYPTION_KEY_VERSION` | Start with `v1`; coordinate key rotation with encrypted data migration |
| `APP_URL` | Exact deployed Render HTTPS origin |
| `WEBAUTHN_RP_ID` | Hostname only, e.g. `alchemy-2-0.onrender.com` |
| `WEBAUTHN_ALLOWED_ORIGINS` | Exact allowed HTTPS origin(s), comma-separated, no paths |
| `GEMINI_API_KEY` | Existing server-side Gemini key, only if Jarvis is configured for Gemini |

Do not add `ENABLE_PREVIEW_AUTH=true` in production. Never put the service-role key, encryption key or Gemini key in frontend variables, Git, screenshots or chat.

Generate an encryption key locally with Node.js:
```bash
node -e "console.log(require('node:crypto').randomBytes(32).toString('base64'))"
```
Copy the output directly into Render's secret environment setting. Do not send it to anyone or commit it. Keep a secure backup; losing it makes previously encrypted TOTP/integration secrets unrecoverable.

## 4. What is still required in code before Supabase can be enabled

The existing repository contains an owner-scoped snapshot schema/RLS/RPC, a typed browser persistence adapter and an AES-256-GCM helper. Snapshot HTTP routes are intentionally locked until application-level encryption is implemented. These are preparation pieces, not a complete live integration.

Still required:
- When Supabase is configured, password login is connected to the configured single owner and creates a hashed durable app session. Until then, the existing `ALCHEMY_APP_PASSWORD` path remains available as a compatibility mode unless `SUPABASE_AUTH_REQUIRED=true`. Supabase refresh-token handling is not used by the app session; session lifetime and revocation are managed by the server-side opaque cookie session.
- The Supabase owner UUID is derived from the verified Supabase Auth password-login response and bound to the server-created durable session. Protected requests verify the opaque session hash against the owner-bound database record.
- Durable, owner-bound passkey/TOTP/recovery-code storage and persistent rate limiting. Durable password-authenticated app sessions are connected to login, protected requests, restart rehydration and logout revocation. Passkey/TOTP/recovery credentials, step-up grants and rate-limit state remain process-memory only; those factors are disabled when Supabase owner auth is active.
- Integrate AES-GCM encryption into TOTP and provider-token persistence, including a tested key rotation/recovery procedure.
- Encrypt complete Alchemy snapshots at application level before enabling cloud backup. The current snapshot adapter validates integrity and owner isolation but the database schema stores JSONB; all snapshot HTTP endpoints now deliberately return `503 snapshot_encryption_not_ready`, even when Supabase is configured. Do not remove this guard until AES-256-GCM envelope storage, owner-bound authentication, key rotation and restore tests are complete. Then wire snapshot reads/writes to the app only after authenticated staging tests and a non-destructive local-data migration/rollback path.
- Verify readiness probes actual Supabase connectivity and permissions; a configured URL/key alone is not readiness.
- Validate Render restart, redeploy, multiple-instance behavior, Android browser and desktop.


### Durable session adapter checkpoint

A server-only Supabase session-store adapter is now prepared in `server/supabaseDurableSessions.ts`. It:
- hashes the opaque 256-bit browser cookie token with SHA-256 before storage;
- accepts an owner UUID only from a caller that has already verified Supabase Auth;
- supports create, active-session lookup, activity touch and revocation;
- uses the service-role key only in server-side requests and never returns it to the client;
- fails closed on malformed database records and Supabase errors.

Regression tests are included in the standard test command. This adapter is connected to the app's password-login and protected-session path. The existing passkey/TOTP/recovery credential vault and security rate limits remain in memory and are deliberately not represented as durable. Do not enable those factors in production until their owner-scoped storage and tests are complete.

## 5. Supabase owner account

Create exactly one owner account from the Supabase Auth dashboard/invite process and set its email in `SUPABASE_OWNER_EMAIL`. Public sign-up must remain disabled. The app password-login route now authenticates against this configured owner, then creates an opaque, hashed durable application session. Refresh tokens are not stored in the browser or server session; the app uses its own bounded session lifetime and explicit server-side revocation. Apply and test the checked-in migrations before enabling this path in Render.

## 6. Release gate

Until the above is implemented and tested, keep the app private and use synthetic data only. Do not ask the owner to perform a Jarvis live test yet. A green build alone does not prove authentication, persistence, privacy isolation or AI connectivity.
