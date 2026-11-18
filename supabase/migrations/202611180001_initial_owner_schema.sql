-- Alchemy 1.0 initial persistence schema
-- Apply to a Supabase staging project first. Never run against production before backup/restore validation.
begin;

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
  schema_version integer not null check (schema_version > 0),
  revision bigint not null default 1 check (revision > 0),
  payload jsonb not null,
  payload_sha256 text,
  source text not null default 'migration' check (source in ('migration', 'autosave', 'manual_backup', 'restore')),
  created_at timestamptz not null default timezone('utc', now()),
  unique (owner_id, revision)
);

create index if not exists app_state_snapshots_owner_created_idx
  on public.app_state_snapshots(owner_id, created_at desc);

-- Credential tables are server-only. No authenticated-client policies are intentionally created.
create table if not exists public.security_passkeys (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users(id) on delete cascade,
  credential_id text not null unique,
  public_key text not null,
  counter bigint not null default 0 check (counter >= 0),
  transports text[] not null default '{}',
  nickname text not null,
  created_at timestamptz not null default timezone('utc', now()),
  last_used_at timestamptz
);

create index if not exists security_passkeys_owner_idx on public.security_passkeys(owner_id);

create table if not exists public.security_totp (
  owner_id uuid primary key references auth.users(id) on delete cascade,
  secret_ciphertext text not null,
  encryption_key_version text not null,
  enabled boolean not null default false,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.security_recovery_codes (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users(id) on delete cascade,
  code_hash text not null,
  used_at timestamptz,
  created_at timestamptz not null default timezone('utc', now())
);

create index if not exists security_recovery_codes_owner_unused_idx
  on public.security_recovery_codes(owner_id, created_at)
  where used_at is null;

create table if not exists public.security_sessions (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users(id) on delete cascade,
  session_token_hash text not null unique,
  authenticated_with text not null check (authenticated_with in ('passkey', 'totp', 'recovery_code')),
  app_authenticated_at timestamptz,
  last_activity_at timestamptz not null default timezone('utc', now()),
  step_up_expires_at timestamptz,
  sensitive_unlocked_until timestamptz,
  revoked_at timestamptz,
  expires_at timestamptz not null,
  created_at timestamptz not null default timezone('utc', now())
);

create index if not exists security_sessions_owner_active_idx
  on public.security_sessions(owner_id, expires_at)
  where revoked_at is null;

create table if not exists public.integration_connections (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users(id) on delete cascade,
  provider text not null check (provider in ('google_calendar', 'gmail', 'instagram', 'other')),
  status text not null default 'disconnected' check (status in ('connected', 'disconnected', 'error', 'revoked')),
  scopes text[] not null default '{}',
  account_label text,
  access_token_ciphertext text,
  refresh_token_ciphertext text,
  encryption_key_version text,
  token_expires_at timestamptz,
  connected_at timestamptz,
  last_sync_at timestamptz,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  unique (owner_id, provider)
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

-- Enable RLS everywhere. Authenticated users can access only their own profile and
-- snapshots. Credential/session/token tables remain inaccessible to browser clients;
-- the trusted server accesses them with a server-only service role.
alter table public.owner_profiles enable row level security;
alter table public.app_state_snapshots enable row level security;
alter table public.security_passkeys enable row level security;
alter table public.security_totp enable row level security;
alter table public.security_recovery_codes enable row level security;
alter table public.security_sessions enable row level security;
alter table public.integration_connections enable row level security;
alter table public.audit_events enable row level security;

drop policy if exists owner_profiles_select_self on public.owner_profiles;
create policy owner_profiles_select_self on public.owner_profiles
  for select to authenticated using (owner_id = (select auth.uid()));

drop policy if exists owner_profiles_insert_self on public.owner_profiles;
create policy owner_profiles_insert_self on public.owner_profiles
  for insert to authenticated with check (owner_id = (select auth.uid()));

drop policy if exists owner_profiles_update_self on public.owner_profiles;
create policy owner_profiles_update_self on public.owner_profiles
  for update to authenticated
  using (owner_id = (select auth.uid()))
  with check (owner_id = (select auth.uid()));

drop policy if exists app_state_snapshots_select_self on public.app_state_snapshots;
create policy app_state_snapshots_select_self on public.app_state_snapshots
  for select to authenticated using (owner_id = (select auth.uid()));

drop policy if exists app_state_snapshots_insert_self on public.app_state_snapshots;
create policy app_state_snapshots_insert_self on public.app_state_snapshots
  for insert to authenticated with check (owner_id = (select auth.uid()));

-- Snapshots are append-only from the browser: no update/delete policy is granted.
-- Credential, session, integration-token and audit tables intentionally have no
-- authenticated policies. Never expose the service-role key to the client.

commit;
