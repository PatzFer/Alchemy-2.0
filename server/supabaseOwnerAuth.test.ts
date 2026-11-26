import test from 'node:test';
import assert from 'node:assert/strict';
import { SupabaseOwnerAuth } from './supabaseOwnerAuth';
import type { FetchLike, SupabaseServerConfig } from './supabasePersistence';

const config: SupabaseServerConfig = {
  url: 'https://example.supabase.co',
  anonKey: 'public-anon-key',
  serviceRoleKey: 'server-only-key',
};
const ownerId = 'd4f1c1a2-1234-4a5b-9c8d-1234567890ab';

function ok(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json' } });
}

test('authenticates only the configured Supabase owner by password', async () => {
  let requestUrl = '';
  let requestInit: RequestInit | undefined;
  const fetcher: FetchLike = async (input, init) => {
    requestUrl = String(input);
    requestInit = init;
    return ok({ access_token: 'a'.repeat(64), user: { id: ownerId, email: 'owner@example.test' } });
  };
  const auth = new SupabaseOwnerAuth(config, { ownerEmail: ' Owner@Example.Test ' }, fetcher);
  const owner = await auth.authenticate('correct horse battery staple');
  assert.equal(owner.id, ownerId);
  assert.equal(owner.email, 'owner@example.test');
  assert.match(requestUrl, /auth\/v1\/token\?grant_type=password$/);
  assert.equal(requestInit?.method, 'POST');
  assert.equal(new Headers(requestInit?.headers).get('apikey'), config.anonKey);
  assert.deepEqual(JSON.parse(String(requestInit?.body)), {
    email: 'owner@example.test',
    password: 'correct horse battery staple',
  });
});

test('rejects an authenticated account that is not the configured owner', async () => {
  const auth = new SupabaseOwnerAuth(config, { ownerEmail: 'owner@example.test' }, async () =>
    ok({ access_token: 'a'.repeat(64), user: { id: ownerId, email: 'other@example.test' } }));
  await assert.rejects(() => auth.authenticate('password'), /did not match the configured Alchemy owner/);
});

test('rejects malformed identities and missing access tokens', async () => {
  for (const body of [
    { access_token: 'a'.repeat(64), user: { id: 'not-a-uuid', email: 'owner@example.test' } },
    { access_token: '', user: { id: ownerId, email: 'owner@example.test' } },
    { user: { id: ownerId, email: 'owner@example.test' } },
  ]) {
    const auth = new SupabaseOwnerAuth(config, { ownerEmail: 'owner@example.test' }, async () => ok(body));
    await assert.rejects(() => auth.authenticate('password'), /did not match/);
  }
});

test('rejects invalid configuration and password before calling Supabase', async () => {
  let calls = 0;
  const fetcher: FetchLike = async () => { calls++; return ok({}); };
  const missingEmail = new SupabaseOwnerAuth(config, { ownerEmail: '' }, fetcher);
  await assert.rejects(() => missingEmail.authenticate('password'), /owner email/);
  const auth = new SupabaseOwnerAuth(config, { ownerEmail: 'owner@example.test' }, fetcher);
  await assert.rejects(() => auth.authenticate(''), /owner password/);
  await assert.rejects(() => auth.authenticate('x'.repeat(1025)), /owner password/);
  assert.equal(calls, 0);
});

test('does not leak Supabase authentication response bodies in errors', async () => {
  const auth = new SupabaseOwnerAuth(config, { ownerEmail: 'owner@example.test' }, async () =>
    new Response('private upstream details', { status: 400 }));
  await assert.rejects(() => auth.authenticate('wrong'), (error: Error) => {
    assert.equal(error.message, 'Supabase owner credentials were rejected.');
    assert.equal(error.message.includes('private upstream'), false);
    return true;
  });
});
