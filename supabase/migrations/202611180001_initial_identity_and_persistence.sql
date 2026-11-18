-- Alchemy 1.0: initial owner-scoped persistence and identity schema.
-- Apply to a staging Supabase project first. This migration does not import or delete app data.
-- Sensitive credential/token tables are server-only: do not grant them to anon/authenticated.

create extension if not exists pgcrypto;

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = timezone('utc', now());
  return new;
end;
$$;

create table if not exists public.owner_profiles (
  owner_id uuid primary key references auth.users(id) on delete cascade,
  display_name text,
  schema_version integer not null default 1 check (schema_version > 0),
  preferences jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.app_state_snapshots (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users(id) on delete cascade,
  revision bigint not null check (revision > 0),
  schema_version integer not null check (schema_version > 0),
  payload jsonb not null,
  payload_sha256 text not null check (payload_sha256 ~ '^[a-f0-9]{64}$'),
  created_at timestamptz not null default timezone('utc', now()),
  unique (owner_id, revision)
);

create index if not exists app_state_snapshots_owner_created_idx
  on public.app_state_snapshots(owner_id, created_at desc);

-- WebAuthn public credential material only. Private keys never belong in this database.
create table if not exists public.security_passkeys (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users(id) on delete cascade,
  credential_id text not null unique,
  public_key text not null,
  counter bigint not null default 0 check (counter >= 0),
  transports text[] not null default '{}',
  nickname text not null default 'Passkey',
  aaguid text,
  backed_up boolean,
  created_at timestamptz not null default timezone('utc', now()),
  last_used_at timestamptz
);

-- Ciphertext only. Encryption/decryption keys must live outside Postgres (KMS/server secret).
create table if not exists public.security_totp (
  owner_id uuid primary key references auth.users(id) on delete cascade,
  secret_ciphertext bytea not null,
  encryption_key_version text not null,
  enabled boolean not null default false,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.security_recovery_codes (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users(id) on delete cascade,
  code_hash text not null,
  created_at timestamptz not null default timezone('utc', now()),
  expires_at timestamptz,
  used_at timestamptz
);

create index if not exists security_recovery_codes_owner_unused_idx
  on public.security_recovery_codes(owner_id, created_at)
  where used_at is null;

-- Store only a hash of the opaque cookie/session identifier, never the raw browser token.
create table if not exists public.security_sessions (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users(id) on delete cascade,
  session_hash text not null unique,
  authenticated_with text not null check (authenticated_with in ('passkey','totp','recovery_code')),
  created_at timestamptz not null default timezone('utc', now()),
  last_activity_at timestamptz not null default timezone('utc', now()),
  expires_at timestamptz not null,
  step_up_expires_at timestamptz,
  sensitive_unlocked_until timestamptz,
  revoked_at timestamptz
);

create index if not exists security_sessions_owner_active_idx
  on public.security_sessions(owner_id, expires_at desc)
  where revoked_at is null;

-- Provider tokens are encrypted server-side. Never return token ciphertext or plaintext to the browser.
create table if not exists public.integration_connections (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users(id) on delete cascade,
  provider text not null check (provider in ('google_calendar','gmail','instagram')),
  account_label text,
  scopes text[] not null default '{}',
  access_token_ciphertext bytea,
  refresh_token_ciphertext bytea,
  encryption_key_version text,
  access_token_expires_at timestamptz,
  status text not null default 'not_connected' check (status in ('not_connected','connected','expired','revoked','error')),
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  unique(owner_id, provider),
  check (
    (status <> 'connected')
    or (access_token_ciphertext is not null and encryption_key_version is not null)
  )
);

create table if not exists public.audit_events (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users(id) on delete cascade,
  event_type text not null,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default timezone('utc', now())
);

create index if not exists audit_events_owner_created_idx
  on public.audit_events(owner_id, created_at desc);

drop trigger if exists owner_profiles_set_updated_at on public.owner_profiles;
create trigger owner_profiles_set_updated_at
  before update on public.owner_profiles
  for each row execute function public.set_updated_at();

drop trigger if exists security_totp_set_updated_at on public.security_totp;
create trigger security_totp_set_updated_at
  before update on public.security_totp
  for each row execute function public.set_updated_at();

drop trigger if exists integration_connections_set_updated_at on public.integration_connections;
create trigger integration_connections_set_updated_at
  before update on public.integration_connections
  for each row execute function public.set_updated_at();

alter table public.owner_profiles enable row level security;
alter table public.app_state_snapshots enable row level security;
alter table public.security_passkeys enable row level security;
alter table public.security_totp enable row level security;
alter table public.security_recovery_codes enable row level security;
alter table public.security_sessions enable row level security;
alter table public.integration_connections enable row level security;
alter table public.audit_events enable row level security;

drop policy if exists owner_profiles_select_own on public.owner_profiles;
create policy owner_profiles_select_own on public.owner_profiles
  for select to authenticated using (owner_id = (select auth.uid()));
drop policy if exists owner_profiles_insert_own on public.owner_profiles;
create policy owner_profiles_insert_own on public.owner_profiles
  for insert to authenticated with check (owner_id = (select auth.uid()));
drop policy if exists owner_profiles_update_own on public.owner_profiles;
create policy owner_profiles_update_own on public.owner_profiles
  for update to authenticated using (owner_id = (select auth.uid()))
  with check (owner_id = (select auth.uid()));

drop policy if exists app_state_snapshots_select_own on public.app_state_snapshots;
create policy app_state_snapshots_select_own on public.app_state_snapshots
  for select to authenticated using (owner_id = (select auth.uid()));
drop policy if exists app_state_snapshots_insert_own on public.app_state_snapshots;
create policy app_state_snapshots_insert_own on public.app_state_snapshots
  for insert to authenticated with check (owner_id = (select auth.uid()));
drop policy if exists app_state_snapshots_update_own on public.app_state_snapshots;
create policy app_state_snapshots_update_own on public.app_state_snapshots
  for update to authenticated using (owner_id = (select auth.uid()))
  with check (owner_id = (select auth.uid()));
drop policy if exists app_state_snapshots_delete_own on public.app_state_snapshots;
create policy app_state_snapshots_delete_own on public.app_state_snapshots
  for delete to authenticated using (owner_id = (select auth.uid()));

-- Security credentials, session hashes, provider token ciphertext and audit events are server-only.
-- Server routes must use a server-side Supabase client with the service-role key after verifying
-- the caller's Supabase JWT and deriving owner_id from auth.uid()/the verified JWT subject.
revoke all on public.security_passkeys from anon, authenticated;
revoke all on public.security_totp from anon, authenticated;
revoke all on public.security_recovery_codes from anon, authenticated;
revoke all on public.security_sessions from anon, authenticated;
revoke all on public.integration_connections from anon, authenticated;
revoke all on public.audit_events from anon, authenticated;

grant select, insert, update on public.owner_profiles to authenticated;
grant select, insert, update, delete on public.app_state_snapshots to authenticated;
