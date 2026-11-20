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
| `app_state_snapshots` | Versioned application state during the first safe migration | Server-mediated only; JSONB payload, revision, checksum, source and timestamps |
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

### Snapshot write boundary (implemented on the feature branch)

- Browser roles (`anon` and `authenticated`) have no direct table privileges on `app_state_snapshots`; the server's service-role client is the only data-access path.
- Snapshot writes use `public.save_app_state_snapshot`, a narrowly scoped SECURITY DEFINER RPC with an empty search path, explicit argument validation, service-role-only execution and a transaction-scoped per-owner advisory lock for revision allocation.
- The server verifies the Supabase access token with Supabase Auth and derives the owner ID from the verified identity. It does not accept an owner ID from the browser.
- The API verifies returned snapshot ownership, schema/revision metadata and canonical JSON SHA-256 integrity; request payloads are bounded to 1.5 MB. Canonical hashing follows JSON transport semantics, omitting undefined object properties so the checksum matches the JSONB payload actually stored.
- Snapshot writes and reads also validate the required Alchemy state structure (module arrays, Foundation data and integration state) before accepting or returning a snapshot.
- CI statically checks the migration grants and RPC hardening, and unit tests cover malformed identities, payload limits, owner mismatch, atomic RPC use and snapshot integrity.
- A typed browser persistence adapter now calls only the server-mediated snapshot API with an explicitly supplied Supabase user access token. It never contains a service-role key. The adapter is deliberately not wired to autosave or startup reads yet; localStorage remains the current application store until Supabase Auth is integrated and staging restore tests pass.
- These changes are committed but remain un-applied to any live Supabase database.

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


## Feature-branch security hardening checkpoint — 20 November 2026

The current in-memory security vault has received additional input validation and defensive-copy protections for passkeys, strict six-digit TOTP input validation, format-bounded one-time recovery-code verification with constant-time digest comparison, and bounded WebAuthn challenge input validation. Regression tests cover these boundaries. This does **not** change the ADR's deployment decision: credentials, sessions, rate-limit state and TOTP encryption remain unpersisted/unconfigured in the live app. The feature branch must not be treated as production-ready until durable owner-scoped storage, external encryption key management, staging restore, RLS and restart/revocation tests are implemented and verified.


## Feature-branch encryption primitive — 20 November 2026

A server-only AES-256-GCM envelope encryption helper now exists on the feature branch. It uses a fresh 96-bit nonce per encryption, an authentication tag, and additional authenticated data binding the ciphertext to the owner UUID and secret purpose. The helper requires a 32-byte base64 APP_ENCRYPTION_KEY and an explicit key version; it rejects missing or mismatched key versions and malformed envelopes. Unit tests are included in the standard CI test command.

This helper is not yet integrated into TOTP or provider-token storage. No live encryption key is provisioned, no key rotation/recovery procedure is verified, and the in-memory security vault remains unchanged. It must not be interpreted as completion of durable encrypted credential storage.


## Snapshot concurrency and stale-write protection — 20 November 2026

A forward-only migration adds an expected-revision precondition to the server-only snapshot RPC. The API and browser adapter can supply the revision last observed by the client. The database serializes writes per owner and rejects a mismatch with a conflict rather than silently accepting a stale overwrite. The HTTP layer maps that conflict to 409. CI statically checks that the revision-aware function remains inaccessible to anon/authenticated and executable only by service_role.

The precondition is optional for compatibility; clients that omit it do not receive stale-write protection. The application has not yet enabled automatic cloud writes. The migration must be applied and tested in staging, including simultaneous writers, before cloud sync can be enabled.
