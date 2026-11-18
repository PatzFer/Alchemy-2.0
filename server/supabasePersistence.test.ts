import test from 'node:test';
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import {
  readSupabaseServerConfig,
  SupabasePersistence,
  type FetchLike,
} from './supabasePersistence';

const ownerId = 'd4f1c1a2-1234-4a5b-9c8d-1234567890ab';
const env = {
  SUPABASE_URL: 'https://example.supabase.co',
  SUPABASE_ANON_KEY: 'public-anon-key',
  SUPABASE_SERVICE_ROLE_KEY: 'server-only-service-role',
};

test('Supabase configuration requires all server credentials and HTTPS', () => {
  assert.equal(readSupabaseServerConfig({}), null);
  assert.throws(() => readSupabaseServerConfig({
    ...env,
    SUPABASE_URL: 'http://example.supabase.co',
  }), /HTTPS/);
  assert.throws(() => readSupabaseServerConfig({
    ...env,
    SUPABASE_URL: 'https://user:pass@example.supabase.co',
  }), /credentials/);
  assert.equal(readSupabaseServerConfig(env)?.url, env.SUPABASE_URL);
});

test('owner verification uses Supabase Auth and rejects invalid identities', async () => {
  const calls: Array<{ url: string; init?: RequestInit }> = [];
  const fetcher: FetchLike = async (input, init) => {
    calls.push({ url: String(input), init });
    return new Response(JSON.stringify({ id: ownerId, email: 'owner@example.test' }), { status: 200 });
  };
  const store = new SupabasePersistence(readSupabaseServerConfig(env)!, fetcher);
  const owner = await store.verifyOwner('valid-access-token');
  assert.equal(owner.id, ownerId);
  assert.match(calls[0].url, /\/auth\/v1\/user$/);
  assert.equal(new Headers(calls[0].init?.headers).get('Authorization'), 'Bearer valid-access-token');

  const invalidFetcher: FetchLike = async () =>
    new Response(JSON.stringify({ id: 'not-a-uuid' }), { status: 200 });
  const invalidStore = new SupabasePersistence(readSupabaseServerConfig(env)!, invalidFetcher);
  await assert.rejects(() => invalidStore.verifyOwner('valid-access-token'), /valid authenticated owner/);
});

test('snapshot owner comes from verified Supabase identity and stored payload hash is checked', async () => {
  const calls: Array<{ url: string; init?: RequestInit }> = [];
  const payload = { tasks: [{ id: 'task-1', title: 'Private task' }], realm: 'personal' };
  const payloadHash = createHash('sha256').update(JSON.stringify({ realm: 'personal', tasks: [{ id: 'task-1', title: 'Private task' }] })).digest('hex');
  const fetcher: FetchLike = async (input, init) => {
    const url = String(input);
    calls.push({ url, init });
    if (url.endsWith('/auth/v1/user')) {
      return new Response(JSON.stringify({ id: ownerId }), { status: 200 });
    }
    if (url.includes('/rest/v1/app_state_snapshots?')) {
      return new Response(JSON.stringify([{ revision: 4 }]), { status: 200 });
    }
    if (url.endsWith('/rest/v1/app_state_snapshots')) {
      const body = JSON.parse(String(init?.body));
      assert.equal(body.owner_id, ownerId);
      assert.equal(body.revision, 5);
      assert.equal(body.payload_sha256, payloadHash);
      return new Response(JSON.stringify([{
        id: 'snapshot-id',
        ...body,
        created_at: new Date().toISOString(),
      }]), { status: 201 });
    }
    throw new Error(`Unexpected request: ${url}`);
  };
  const store = new SupabasePersistence(readSupabaseServerConfig(env)!, fetcher);
  const saved = await store.saveSnapshot('verified-token', payload);
  assert.equal(saved.owner_id, ownerId);
  assert.equal(saved.revision, 5);
  assert.equal(calls.length, 3);
  assert.equal(new Headers(calls[1].init?.headers).get('Authorization'), `Bearer ${env.SUPABASE_SERVICE_ROLE_KEY}`);
});

test('snapshot loading rejects a payload whose stored hash does not match', async () => {
  const fetcher: FetchLike = async (input) => {
    const url = String(input);
    if (url.endsWith('/auth/v1/user')) {
      return new Response(JSON.stringify({ id: ownerId }), { status: 200 });
    }
    return new Response(JSON.stringify([{
      id: 'snapshot-id',
      owner_id: ownerId,
      schema_version: 1,
      revision: 1,
      payload: { tasks: [{ id: 'changed' }] },
      payload_sha256: 'incorrect-hash',
      source: 'autosave',
      created_at: new Date().toISOString(),
    }]), { status: 200 });
  };
  const store = new SupabasePersistence(readSupabaseServerConfig(env)!, fetcher);
  await assert.rejects(() => store.loadLatestSnapshot('verified-token'), /integrity check failed/);
});


test('snapshot integrity is stable when PostgreSQL jsonb returns object keys in a different order', async () => {
  const originalPayload = { tasks: [{ id: 'task-1', title: 'Private task' }], realm: 'personal' };
  const canonicalPayload = JSON.stringify({ realm: 'personal', tasks: [{ id: 'task-1', title: 'Private task' }] });
  const expectedHash = createHash('sha256').update(canonicalPayload).digest('hex');
  const fetcher: FetchLike = async (input) => {
    if (String(input).endsWith('/auth/v1/user')) {
      return new Response(JSON.stringify({ id: ownerId }), { status: 200 });
    }
    return new Response(JSON.stringify([{
      id: 'snapshot-id',
      owner_id: ownerId,
      schema_version: 1,
      revision: 1,
      payload: originalPayload,
      payload_sha256: expectedHash,
      source: 'autosave',
      created_at: new Date().toISOString(),
    }]), { status: 200 });
  };
  const store = new SupabasePersistence(readSupabaseServerConfig(env)!, fetcher);
  const loaded = await store.loadLatestSnapshot('verified-token');
  assert.deepEqual(loaded?.payload, originalPayload);
});
