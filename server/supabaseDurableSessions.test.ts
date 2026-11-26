import test from 'node:test';
import assert from 'node:assert/strict';
import {
  hashSessionToken,
  SupabaseDurableSessionStore,
  type DurableSessionRecord,
} from './supabaseDurableSessions';
import type { FetchLike, SupabaseServerConfig } from './supabasePersistence';

const ownerId = 'd4f1c1a2-1234-4a5b-9c8d-1234567890ab';
const cookieToken = 'a'.repeat(64);
const config: SupabaseServerConfig = {
  url: 'https://example.supabase.co',
  anonKey: 'public-key',
  serviceRoleKey: 'server-only-key',
};
const now = new Date('2026-11-26T12:00:00.000Z');
const future = new Date('2026-11-27T12:00:00.000Z');

function row(overrides: Partial<DurableSessionRecord> = {}): DurableSessionRecord {
  return {
    id: 'e4f1c1a2-1234-4a5b-9c8d-1234567890ab',
    owner_id: ownerId,
    session_hash: hashSessionToken(cookieToken),
    authenticated_with: 'password',
    created_at: now.toISOString(),
    last_activity_at: now.toISOString(),
    expires_at: future.toISOString(),
    step_up_expires_at: null,
    sensitive_unlocked_until: null,
    revoked_at: null,
    ...overrides,
  };
}

function response(data: unknown, status = 200): Response {
  return new Response(JSON.stringify(data), { status, headers: { 'Content-Type': 'application/json' } });
}

test('session token hashing accepts only opaque 256-bit hex tokens and never returns the token', () => {
  const digest = hashSessionToken(cookieToken);
  assert.match(digest, /^[a-f0-9]{64}$/);
  assert.notEqual(digest, cookieToken);
  assert.equal(hashSessionToken(cookieToken.toUpperCase()), digest);
  assert.throws(() => hashSessionToken('short'), /256-bit opaque/);
  assert.throws(() => hashSessionToken('g'.repeat(64)), /256-bit opaque/);
});

test('creates an owner-bound session and sends only the session hash to Supabase', async () => {
  let requestUrl = '';
  let requestInit: RequestInit | undefined;
  const fetcher: FetchLike = async (input, init) => {
    requestUrl = String(input);
    requestInit = init;
    const body = JSON.parse(String(init?.body));
    return response([row({ owner_id: body.owner_id, session_hash: body.session_hash })], 201);
  };
  const store = new SupabaseDurableSessionStore(config, fetcher);
  const created = await store.create(ownerId, cookieToken, 'password', future);
  const body = JSON.parse(String(requestInit?.body));
  assert.equal(requestInit?.method, 'POST');
  assert.match(requestUrl, /security_sessions$/);
  assert.equal(body.owner_id, ownerId);
  assert.equal(body.session_hash, hashSessionToken(cookieToken));
  assert.equal(body.session_hash.includes(cookieToken), false);
  assert.equal(body.authenticated_with, 'password');
  assert.equal(created.owner_id, ownerId);
  assert.equal((requestInit?.headers as Record<string, string>).Authorization, 'Bearer server-only-key');
});

test('rejects unverified owners, unsupported methods and invalid expiries before writing', async () => {
  let calls = 0;
  const store = new SupabaseDurableSessionStore(config, async () => { calls++; return response([]); });
  await assert.rejects(() => store.create('not-a-uuid', cookieToken, 'password', future), /verified Supabase owner/);
  await assert.rejects(() => store.create(ownerId, cookieToken, 'preview_test_mode' as never, future), /Unsupported/);
  await assert.rejects(() => store.create(ownerId, cookieToken, 'password', now), /future date/);
  assert.equal(calls, 0);
});

test('finds an active session by token hash and returns null for no match', async () => {
  let requested = '';
  const store = new SupabaseDurableSessionStore(config, async (input) => {
    requested = String(input);
    return response([row()]);
  });
  const found = await store.findActive(cookieToken, now);
  assert.equal(found?.owner_id, ownerId);
  assert.match(requested, /session_hash=eq./);
  assert.match(requested, /revoked_at=is.null/);
  assert.match(requested, /expires_at=gt./);

  const empty = new SupabaseDurableSessionStore(config, async () => response([]));
  assert.equal(await empty.findActive(cookieToken, now), null);
});

test('rejects malformed or revoked records returned by Supabase', async () => {
  const malformedOwner = new SupabaseDurableSessionStore(config, async () => response([row({
    owner_id: 'not-a-uuid',
  })]));
  await assert.rejects(() => malformedOwner.findActive(cookieToken, now), /invalid or inactive/);
  const revoked = new SupabaseDurableSessionStore(config, async () => response([row({
    revoked_at: now.toISOString(),
  })]));
  await assert.rejects(() => revoked.findActive(cookieToken, now), /invalid or inactive/);
});

test('touch and revoke only address the hashed session and report whether a row changed', async () => {
  const requests: Array<{ url: string; init?: RequestInit }> = [];
  const store = new SupabaseDurableSessionStore(config, async (input, init) => {
    requests.push({ url: String(input), init });
    const body = JSON.parse(String(init?.body));
    return response([row({
      last_activity_at: body.last_activity_at || now.toISOString(),
      revoked_at: body.revoked_at || null,
      step_up_expires_at: body.step_up_expires_at ?? null,
      sensitive_unlocked_until: body.sensitive_unlocked_until ?? null,
    })]);
  });
  assert.equal(await store.touch(cookieToken, now), true);
  assert.equal(await store.revoke(cookieToken, now), true);
  assert.equal(requests.length, 2);
  for (const request of requests) {
    assert.equal(request.init?.method, 'PATCH');
    assert.match(request.url, /session_hash=eq./);
    assert.doesNotMatch(request.url, new RegExp(cookieToken));
  }
  assert.equal(await new SupabaseDurableSessionStore(config, async () => response([])).touch(cookieToken, now), false);
});

test('fails closed on Supabase errors without returning response bodies', async () => {
  const store = new SupabaseDurableSessionStore(config, async () => new Response('sensitive database detail', { status: 500 }));
  await assert.rejects(() => store.findActive(cookieToken, now), /Supabase durable session request failed (500)/);
});
