import test from 'node:test';
import assert from 'node:assert/strict';
import { SupabaseSecurityPreferencesStore, isDurableSecurityPreferences, type DurableSecurityPreferences } from './supabaseSecurityPreferences';
import type { FetchLike, SupabaseServerConfig } from './supabasePersistence';

const ownerId = 'd4f1c1a2-1234-4a5b-9c8d-1234567890ab';
const config: SupabaseServerConfig = {
  url: 'https://example.supabase.co',
  anonKey: 'anon',
  serviceRoleKey: 'server-secret',
};
const preferences: DurableSecurityPreferences = {
  calendarRead: true,
  calendarWrite: false,
  aiMayCreateTasks: true,
  aiRequiresConfirmationForModifications: true,
  aiRequiresConfirmationForDestructive: true,
  allowCycleDataToAI: false,
  allowPersonalDataToAI: true,
  allowMarilunaDataToAI: true,
  allowFinancialDataToAI: false,
  allowWellbeingDataToAI: false,
  activeAiProvider: 'gemini-server',
};

test('validates known preferences and requires immutable confirmation safeguards', () => {
  assert.equal(isDurableSecurityPreferences(preferences), true);
  assert.equal(isDurableSecurityPreferences({ ...preferences, aiRequiresConfirmationForDestructive: false }), false);
  assert.equal(isDurableSecurityPreferences({ ...preferences, activeAiProvider: 'unknown' }), false);
  assert.equal(isDurableSecurityPreferences({ ...preferences, allowCycleDataToAI: 'yes' }), false);
});

test('loads security preferences from the authenticated owner profile only', async () => {
  let url = '';
  const fetcher: FetchLike = async (input, init) => {
    url = String(input);
    assert.equal(init?.method, 'GET');
    return new Response(JSON.stringify([{ preferences: { theme: 'dark', security: preferences } }]), { status: 200 });
  };
  const store = new SupabaseSecurityPreferencesStore(config, fetcher);
  assert.deepEqual(await store.load(ownerId), preferences);
  assert.match(url, /owner_id=eq./);
  assert.equal(await new SupabaseSecurityPreferencesStore(config, async () =>
    new Response(JSON.stringify([{ preferences: { security: { ...preferences, activeAiProvider: 'fake' } } }]), { status: 200 })).load(ownerId), null);
});

test('saves only verified owner preferences through server-only RPC', async () => {
  let url = '';
  let init: RequestInit | undefined;
  const fetcher: FetchLike = async (input, request) => {
    url = String(input);
    init = request;
    return new Response(JSON.stringify(preferences), { status: 200 });
  };
  const store = new SupabaseSecurityPreferencesStore(config, fetcher);
  await store.save(ownerId, preferences);
  assert.match(url, /rpc\/save_alchemy_security_preferences$/);
  assert.equal(init?.method, 'POST');
  assert.equal(new Headers(init?.headers).get('Authorization'), 'Bearer server-secret');
  assert.deepEqual(JSON.parse(String(init?.body)), { p_owner_id: ownerId, p_preferences: preferences });
});

test('rejects invalid owner and unsafe settings before writing', async () => {
  let calls = 0;
  const store = new SupabaseSecurityPreferencesStore(config, async () => {
    calls++;
    return new Response(JSON.stringify(preferences), { status: 200 });
  });
  await assert.rejects(() => store.load('not-a-uuid'), /verified Supabase owner/);
  await assert.rejects(() => store.save(ownerId, { ...preferences, aiRequiresConfirmationForModifications: false }), /invalid|weaken/i);
  assert.equal(calls, 0);
});

test('fails closed when Supabase does not confirm preference persistence', async () => {
  const store = new SupabaseSecurityPreferencesStore(config, async () =>
    new Response(JSON.stringify({ ok: true }), { status: 200 }));
  await assert.rejects(() => store.save(ownerId, preferences), /did not confirm/);
});
