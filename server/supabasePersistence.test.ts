import test from 'node:test';
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import {
  readSupabaseServerConfig,
  SupabasePersistence,
  isValidAlchemySnapshotPayload,
  type FetchLike,
} from './supabasePersistence';

const ownerId = 'd4f1c1a2-1234-4a5b-9c8d-1234567890ab';

function canonicalJson(value: unknown): string {
  if (value === null || typeof value !== 'object') return JSON.stringify(value);
  if (Array.isArray(value)) return `[${value.map(canonicalJson).join(',')}]`;
  const record = value as Record<string, unknown>;
  return `{${Object.keys(record).sort().map((key) => `${JSON.stringify(key)}:${canonicalJson(record[key])}`).join(',')}}`;
}
const validPayload = {
  tasks: [], goals: [], ideas: [], projects: [], calendarEvents: [], memories: [],
  dailyCheckIns: [], notifications: [], proactiveSuggestions: [], chatHistory: [],
  lifeProfile: {}, contentPlan: {}, personalStyle: {}, nutrition: {}, cycleProfile: {},
  wellbeing: {}, notificationSettings: {}, isSampleData: false, setupStatus: 'not_started',
  foundation: { aboutYou: {} },
  integrations: { calendar: {}, gmail: {} },
};

const env = {
  SUPABASE_URL: 'https://example.supabase.co',
  SUPABASE_ANON_KEY: 'public-anon-key',
  SUPABASE_SERVICE_ROLE_KEY: 'server-only-service-role',
};


test('snapshot payload validator accepts the complete app contract and rejects missing core modules', () => {
  assert.equal(isValidAlchemySnapshotPayload(validPayload), true);
  assert.equal(isValidAlchemySnapshotPayload({ ...validPayload, nutrition: undefined }), false);
  assert.equal(isValidAlchemySnapshotPayload({ ...validPayload, chatHistory: undefined }), false);
  assert.equal(isValidAlchemySnapshotPayload({ ...validPayload, setupStatus: 'unknown' }), false);
  assert.equal(isValidAlchemySnapshotPayload({ ...validPayload, foundation: { aboutYou: [] } }), false);
  assert.equal(isValidAlchemySnapshotPayload([]), false);
});

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


test('owner verification rejects malformed UUIDs and oversized tokens', async () => {
  const invalidFetcher: FetchLike = async () =>
    new Response(JSON.stringify({ id: 'd4f1c1a2-1234-0a5b-9c8d-1234567890ab' }), { status: 200 });
  const store = new SupabasePersistence(readSupabaseServerConfig(env)!, invalidFetcher);
  await assert.rejects(() => store.verifyOwner('valid-access-token'), /valid authenticated owner/);
  await assert.rejects(() => store.verifyOwner('x'.repeat(8193)), /valid Supabase access token/);
});

test('snapshot writes reject oversized payloads before calling the database RPC', async () => {
  let rpcCalled = false;
  const fetcher: FetchLike = async (input) => {
    if (String(input).endsWith('/auth/v1/user')) {
      return new Response(JSON.stringify({ id: ownerId }), { status: 200 });
    }
    rpcCalled = true;
    return new Response('[]', { status: 200 });
  };
  const store = new SupabasePersistence(readSupabaseServerConfig(env)!, fetcher);
  await assert.rejects(
    () => store.saveSnapshot('verified-token', { ...validPayload, large: 'x'.repeat(1_500_001) }),
    /1.5 MB persistence limit/,
  );
  assert.equal(rpcCalled, false);
});

test('snapshot loading rejects a record returned for a different owner', async () => {
  const otherOwnerId = 'a4f1c1a2-1234-4a5b-9c8d-1234567890ab';
  const fetcher: FetchLike = async (input) => {
    if (String(input).endsWith('/auth/v1/user')) {
      return new Response(JSON.stringify({ id: ownerId }), { status: 200 });
    }
    return new Response(JSON.stringify([{
      id: 'snapshot-id',
      owner_id: otherOwnerId,
      schema_version: 1,
      revision: 1,
      payload: { tasks: [] },
      payload_sha256: createHash('sha256').update('{"tasks":[]}').digest('hex'),
      source: 'autosave',
      created_at: new Date().toISOString(),
    }]), { status: 200 });
  };
  const store = new SupabasePersistence(readSupabaseServerConfig(env)!, fetcher);
  await assert.rejects(
    () => store.loadLatestSnapshot('verified-token'),
    /owner does not match/,
  );
});

test('snapshot owner comes from verified Supabase identity and stored payload hash is checked', async () => {
  const calls: Array<{ url: string; init?: RequestInit }> = [];
  const payload = { ...validPayload, tasks: [{ id: 'task-1', title: 'Private task' }], realm: 'personal' };
  const payloadHash = createHash('sha256').update(canonicalJson(payload)).digest('hex');
  const fetcher: FetchLike = async (input, init) => {
    const url = String(input);
    calls.push({ url, init });
    if (url.endsWith('/auth/v1/user')) {
      return new Response(JSON.stringify({ id: ownerId }), { status: 200 });
    }
    if (url.endsWith('/rest/v1/rpc/save_app_state_snapshot')) {
      const body = JSON.parse(String(init?.body));
      assert.equal(body.p_owner_id, ownerId);
      assert.equal(body.p_schema_version, 1);
      assert.deepEqual(body.p_payload, payload);
      assert.equal(body.p_payload_sha256, payloadHash);
      assert.equal(body.p_source, 'autosave');
      return new Response(JSON.stringify([{
        id: 'snapshot-id',
        owner_id: body.p_owner_id,
        schema_version: body.p_schema_version,
        revision: 5,
        payload: body.p_payload,
        payload_sha256: body.p_payload_sha256,
        source: body.p_source,
        created_at: new Date().toISOString(),
      }]), { status: 200 });
    }
    throw new Error(`Unexpected request: ${url}`);
  };
  const store = new SupabasePersistence(readSupabaseServerConfig(env)!, fetcher);
  const saved = await store.saveSnapshot('verified-token', payload);
  assert.equal(saved.owner_id, ownerId);
  assert.equal(saved.revision, 5);
  assert.equal(calls.length, 2);
  assert.equal(new Headers(calls[1].init?.headers).get('Authorization'), `Bearer ${env.SUPABASE_SERVICE_ROLE_KEY}`);
});


test('snapshot writes reject a database response with altered checksum metadata', async () => {
  const fetcher: FetchLike = async (input, init) => {
    if (String(input).endsWith('/auth/v1/user')) {
      return new Response(JSON.stringify({ id: ownerId }), { status: 200 });
    }
    const body = JSON.parse(String(init?.body));
    return new Response(JSON.stringify([{
      id: 'snapshot-id',
      owner_id: ownerId,
      schema_version: body.p_schema_version,
      revision: 1,
      payload: body.p_payload,
      payload_sha256: '0'.repeat(64),
      source: body.p_source,
      created_at: new Date().toISOString(),
    }]), { status: 200 });
  };
  const store = new SupabasePersistence(readSupabaseServerConfig(env)!, fetcher);
  await assert.rejects(
    () => store.saveSnapshot('verified-token', validPayload),
    /invalid snapshot metadata or content/,
  );
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
      payload: { ...validPayload, tasks: [{ id: 'changed' }] },
      payload_sha256: 'incorrect-hash',
      source: 'autosave',
      created_at: new Date().toISOString(),
    }]), { status: 200 });
  };
  const store = new SupabasePersistence(readSupabaseServerConfig(env)!, fetcher);
  await assert.rejects(() => store.loadLatestSnapshot('verified-token'), /integrity check failed/);
});


test('snapshot integrity is stable when PostgreSQL jsonb returns object keys in a different order', async () => {
  const originalPayload = { ...validPayload, tasks: [{ id: 'task-1', title: 'Private task' }], realm: 'personal' };
  const expectedHash = createHash('sha256').update(canonicalJson(originalPayload)).digest('hex');
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
