-- Persist the AI privacy firewall and provider selection per authenticated owner.
-- Only the server service role may call this function.
create or replace function public.save_alchemy_security_preferences(
  p_owner_id uuid,
  p_preferences jsonb
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  saved_preferences jsonb;
begin
  if p_owner_id is null or p_preferences is null or jsonb_typeof(p_preferences) <> 'object' then
    raise exception 'invalid_security_preferences';
  end if;

  if p_preferences->>'aiRequiresConfirmationForModifications' <> 'true'
     or p_preferences->>'aiRequiresConfirmationForDestructive' <> 'true'
     or p_preferences->>'activeAiProvider' not in ('openai-server', 'gemini-server', 'local-rules') then
    raise exception 'invalid_security_preferences';
  end if;

  insert into public.owner_profiles (owner_id, preferences)
  values (p_owner_id, jsonb_build_object('security', p_preferences))
  on conflict (owner_id) do update
    set preferences = jsonb_set(
      coalesce(public.owner_profiles.preferences, '{}'::jsonb),
      '{security}',
      p_preferences,
      true
    ),
    updated_at = timezone('utc', now())
  returning preferences->'security' into saved_preferences;

  return saved_preferences;
end;
$$;

revoke all on function public.save_alchemy_security_preferences(uuid, jsonb) from public, anon, authenticated;
grant execute on function public.save_alchemy_security_preferences(uuid, jsonb) to service_role;
