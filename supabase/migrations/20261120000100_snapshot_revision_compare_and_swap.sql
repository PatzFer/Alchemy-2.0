-- Prevent stale browser tabs/devices from silently replacing a newer snapshot.
-- Null expected revision preserves compatibility for existing clients.
create or replace function public.save_app_state_snapshot(
  p_owner_id uuid,
  p_schema_version integer,
  p_payload jsonb,
  p_payload_sha256 text,
  p_source text,
  p_expected_revision bigint
)
returns setof public.app_state_snapshots
language plpgsql
security definer
set search_path = ''
as $$
declare
  current_revision bigint;
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
  if p_expected_revision is not null and p_expected_revision < 0 then
    raise exception 'expected revision cannot be negative';
  end if;

  perform pg_catalog.pg_advisory_xact_lock(
    pg_catalog.hashtextextended(p_owner_id::text, 0)
  );

  select coalesce(pg_catalog.max(snapshot.revision), 0)
    into current_revision
    from public.app_state_snapshots as snapshot
    where snapshot.owner_id = p_owner_id;

  if p_expected_revision is not null and p_expected_revision <> current_revision then
    raise exception 'snapshot_revision_conflict'
      using errcode = 'P0001',
            detail = pg_catalog.format(
              'Expected revision %s but current revision is %s.',
              p_expected_revision, current_revision
            );
  end if;

  next_revision := current_revision + 1;
  insert into public.app_state_snapshots (
    owner_id, schema_version, revision, payload, payload_sha256, source
  ) values (
    p_owner_id, p_schema_version, next_revision, p_payload, p_payload_sha256, p_source
  )
  returning * into saved_snapshot;

  return next saved_snapshot;
end;
$$;

revoke all on function public.save_app_state_snapshot(uuid, integer, jsonb, text, text, bigint)
  from public, anon, authenticated;
grant execute on function public.save_app_state_snapshot(uuid, integer, jsonb, text, text, bigint)
  to service_role;
