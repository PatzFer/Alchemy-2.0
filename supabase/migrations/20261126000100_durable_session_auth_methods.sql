-- Durable app-session support for the Supabase Auth owner boundary.
-- The owner_id must come from a server-verified Supabase Auth identity.
-- The browser cookie/session token is represented in Postgres only by its SHA-256 hash.
alter table public.security_sessions
  drop constraint if exists security_sessions_authenticated_with_check;

alter table public.security_sessions
  add constraint security_sessions_authenticated_with_check
  check (authenticated_with in ('passkey', 'totp', 'recovery_code', 'password'));

-- A revoked or expired session must never become active again.
create index if not exists security_sessions_hash_lookup_idx
  on public.security_sessions(session_hash)
  where revoked_at is null;
