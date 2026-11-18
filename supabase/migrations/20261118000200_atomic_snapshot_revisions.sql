-- Alchemy 1.0: serialize concurrent snapshot writes per owner.
-- The owner ID is supplied only after the API verifies the Supabase access token.
-- This RPC is service-role only; clients cannot choose an owner or invoke it directly.

create or replace function public.save_app_state_snapshot(
  p_owner_id uuid,
  p_schema_version integer,
  p_payload jsonb,
  p_payload_sha256 text,
  p_source text
)
returns setof public.app_state_snapshots
language plpgsql
security definer
set search_path = pg_catalog, public
as $$
declare
  next_revision bigint;
  saved_snapshot public.app_state_snapshots;
begin
  if p_owner_id is null then
    raise exception 'owner id is required';
  end if;
  if p_schema_version is null or p_schema_version < 1 then
    raise exception 'schema version must be positive';
  end if;
  if p_payload is null or pg_catalog.jsonb_typeof(p_payload) <> 'object' then
    raise exception 'snapshot payload must be a JSON object';
  end if;
  if p_payload_sha256 is null or p_payload_sha256 !~ '^[a-f0-9]{64}$' then
    raise exception 'snapshot checksum is invalid';
  end if;
  if p_source is null or p_source not in ('migration', 'autosave', 'manual_backup', 'restore') then
    raise exception 'snapshot source is invalid';
  end if;

  -- A transaction-scoped advisory lock prevents two simultaneous writes for the
  -- same owner from calculating the same next revision.
  perform pg_catalog.pg_advisory_xact_lock(
    pg_catalog.hashtextextended(p_owner_id::text, 0)
  );

  select coalesce(max(snapshot.revision), 0) + 1
    into next_revision
    from public.app_state_snapshots as snapshot
    where snapshot.owner_id = p_owner_id;

  insert into public.app_state_snapshots (
    owner_id, schema_version, revision, payload, payload_sha256, source
  ) values (
    p_owner_id, p_schema_version, next_revision, p_payload, p_payload_sha256, p_source
  )
  returning * into saved_snapshot;

  return next saved_snapshot;
end;
$$;

revoke all on function public.save_app_state_snapshot(uuid, integer, jsonb, text, text)
  from public, anon, authenticated;
grant execute on function public.save_app_state_snapshot(uuid, integer, jsonb, text, text)
  to service_role;
