# Alchemy 1.0 — Persistence and Identity Architecture Decision

Status: Proposed implementation architecture; not connected to a live Supabase project.
Date: 18 November 2026
Branch: `design/phase-1`

## 1. Decision summary

Use Supabase Auth as the identity authority and PostgreSQL as the durable store. The React client must not receive a service-role key. Server-side routes validate the user's Supabase JWT and perform owner-scoped reads/writes. Row Level Security (RLS) is mandatory; server checks are additional, not a replacement.

Do not migrate production user data until a real Supabase project, its redirect URLs, environment secrets, and a verified export/restore procedure are available.

## 2. Identity and session model

- One Supabase Auth user is the owner identity. No public registration is enabled for the personal single-owner deployment.
- The initial owner is provisioned through the Supabase dashboard/invite flow, then completes first-run security setup. Never create an unauthenticated "first user wins" endpoint.
- Browser auth uses the Supabase-supported PKCE flow and secure, HttpOnly, SameSite cookies through a server-side session/BFF boundary where practical. Do not put refresh tokens or service-role secrets in localStorage.
- Server endpoints validate JWT signature, issuer, audience, expiry and subject on every request. The authenticated subject is the only source of `owner_id`; never trust a client-supplied owner id.
- App inactivity lock is separate from identity authentication. It is enforced server-side and does not silently convert an expired app lock into an authenticated session.
- Passkey credentials, TOTP secrets, recovery-code hashes, rate-limit state and step-up grants are persisted per owner. TOTP secrets must be envelope-encrypted with a key held outside the database (deployment secret/KMS); public keys and recovery-code hashes are not plaintext authentication secrets.
- Recovery codes are generated only during an authenticated owner setup/regeneration flow and shown once. Only hashes are stored. Regeneration invalidates the previous set atomically.

## 3. Data model (initial migration target)

| Table | Purpose | Data handling |
|---|---|---|
| `owner_profiles` | Owner preferences and schema version | RLS by `auth.uid()` |
| `app_state_snapshots` | Versioned application state during the first safe migration | One owner-scoped row; JSONB payload, revision, timestamps |
| `tasks`, `goals`, `ideas`, `projects`, `calendar_events` | Future normalized operational records | Owner + realm columns; RLS |
| `memory_items` | Explicit/learned Jarvis memories | Owner + realm + memory type; sensitive scopes separately gated |
| `security_passkeys` | WebAuthn credential public keys and counters | Owner-scoped; never store private keys |
| `security_totp` | Encrypted TOTP secret and enabled state | Envelope encryption; no plaintext secret in DB |
| `security_recovery_codes` | Recovery-code hashes and one-time use state | Hash only; owner-scoped |
| `security_sessions` | Durable app-lock/session metadata and step-up expiry | Opaque hashed session identifier; revoke/expire server-side |
| `integration_connections` | Provider, scopes, status and metadata | Tokens encrypted server-side; no token returned to browser |
| `audit_events` | Security-sensitive events (credential changes, exports, revocations) | Minimal metadata; never log secrets or sensitive content |

All tables include immutable owner ownership, created/updated timestamps and indexes for owner + common query dimensions. Every realm-bearing row uses the existing `personal` or `mariluna` value until a reviewed Shared-realm migration is designed. Do not silently add a Shared realm to the current type system.

## 4. RLS and access rules

- Enable RLS on every owner-data table.
- Policies use `auth.uid() = owner_id` for SELECT/INSERT/UPDATE/DELETE.
- No anonymous policies for personal data, business data, credentials, sessions, integrations or audit records.
- Use database constraints to prevent invalid realm values and cross-owner references.
- Server-side AI context assembly remains allowlist-based and permission-gated. Database access controls do not replace the Jarvis privacy firewall.
- Sensitive cycle, wellbeing, health and nutrition data must have explicit purpose and permission checks. Prefer a separate table or encrypted payload boundary rather than mixing it into a general memory table.

## 5. Migration strategy (non-destructive)

1. Confirm Supabase project ownership, region, Auth configuration, redirect origins and secrets.
2. Take a local JSON export of the current `pm_alchemy_os_data_v1` payload; preserve the legacy key and create a checksum. Never clear browser storage during migration.
3. Validate the export against the current TypeScript AppState shape and record unsupported fields without dropping them.
4. Create the initial owner identity and apply schema/RLS migrations in a staging project first.
5. Import a copy into a staging snapshot row; compare record counts and representative records for every module and realm.
6. Verify read-after-write, backup/export, restore, owner isolation and deletion behavior.
7. Enable dual-read or controlled cutover only after staging checks pass. Keep local data as a rollback copy until the user explicitly accepts cutover.
8. Production cutover requires a verified restore drill and no unresolved data-loss/privacy defects.

## 6. Secrets and deployment configuration

Required server-only configuration (names are illustrative until deployment is selected):
- `SUPABASE_URL`
- `SUPABASE_ANON_KEY` (public key may be exposed only as intended by Supabase)
- `SUPABASE_SERVICE_ROLE_KEY` (server only; never prefixed with `VITE_`)
- `APP_ENCRYPTION_KEY` or KMS envelope-encryption configuration
- Auth redirect/origin allowlist

Do not commit real values. Do not use the service-role key in the browser. Rotate any key that has ever been committed or exposed.

## 7. Explicitly out of scope until verified

- No live Supabase project is configured in this repository.
- No migration is run against a live database.
- No client-side service-role access.
- No promise of end-to-end encryption; this ADR defines server-side encryption boundaries for selected credentials and sensitive fields, not zero-knowledge storage.
- No Shared realm until data ownership, sharing, Jarvis context and migration semantics are designed.
- No production readiness claim until restore, auth, RLS and mobile browser tests pass.

## 8. Acceptance tests before cutover

- Anonymous request cannot read or mutate any owner data.
- Authenticated owner can read/write only rows whose `owner_id` matches their verified JWT subject.
- Changing a request body owner id cannot access another owner's rows.
- Invalid/expired/revoked JWTs fail closed.
- TOTP secret is encrypted at rest and never returned after setup.
- Recovery code is one-time; only its hash is persisted.
- Session timeout and revocation survive server restart.
- A backup restores all modules, both realms and historical records with matching counts/checksum.
- Jarvis cannot read personal/cycle/wellbeing/nutrition records without explicit permission, even if a client sends them in its context payload.
