import test from 'node:test';
import assert from 'node:assert/strict';
import { INITIAL_STATE } from './storage';
import { loadAlchemySnapshot, saveAlchemySnapshot, type PersistenceFetch } from './persistenceClient';

test('client persistence requires an explicit access token and makes no request without one', async () => {
  let called = false;
  const fetcher: PersistenceFetch = async () => {
    called = true;
    return new Response('{}', { status: 200 });
  };
  await assert.rejects(() => loadAlchemySnapshot(' ', fetcher), /geldige Alchemy-aanmeldsessie/);
  await assert.rejects(() => saveAlchemySnapshot('', INITIAL_STATE, fetcher), /geldige Alchemy-aanmeldsessie/);
  await assert.rejects(() => loadAlchemySnapshot('token with spaces', fetcher), /geldige Alchemy-aanmeldsessie/);
  assert.equal(called, false);
});

test('snapshot save sends only the user bearer token and confirms the saved revision', async () => {
  let request: RequestInit | undefined;
  const fetcher: PersistenceFetch = async (_input, init) => {
    request = init;
    return new Response(JSON.stringify({
      snapshot: {
        id: 'snapshot-id',
        owner_id: 'd4f1c1a2-1234-4a5b-9c8d-1234567890ab',
        schema_version: 1,
        revision: 3,
        payload: INITIAL_STATE,
        payload_sha256: 'a'.repeat(64),
        source: 'migration',
        created_at: new Date().toISOString(),
      },
    }), { status: 201 });
  };
  const saved = await saveAlchemySnapshot('user-access-token', INITIAL_STATE, fetcher);
  assert.equal(saved.revision, 3);
  assert.equal(new Headers(request?.headers).get('Authorization'), 'Bearer user-access-token');
  assert.equal(new Headers(request?.headers).has('apikey'), false);
  const body = JSON.parse(String(request?.body));
  assert.equal(body.source, 'migration');
  assert.equal(body.schemaVersion, 1);
  assert.equal(body.payload.setupStatus, INITIAL_STATE.setupStatus);
});


test('snapshot save refuses incomplete local state without contacting the server', async () => {
  let called = false;
  const fetcher: PersistenceFetch = async () => {
    called = true;
    return new Response('{}', { status: 200 });
  };
  await assert.rejects(
    () => saveAlchemySnapshot('user-access-token', { tasks: [] } as any, fetcher),
    /lokale Alchemy-gegevens zijn onvolledig/,
  );
  assert.equal(called, false);
});

test('snapshot save rejects a response that confirms a different source', async () => {
  const fetcher: PersistenceFetch = async () =>
    new Response(JSON.stringify({
      snapshot: {
        id: 'snapshot-id',
        owner_id: 'd4f1c1a2-1234-4a5b-9c8d-1234567890ab',
        schema_version: 1,
        revision: 3,
        payload: INITIAL_STATE,
        payload_sha256: 'a'.repeat(64),
        source: 'autosave',
        created_at: new Date().toISOString(),
      },
    }), { status: 201 });
  await assert.rejects(
    () => saveAlchemySnapshot('user-access-token', INITIAL_STATE, fetcher),
    /geldige Alchemy-back-up bevestigd/,
  );
});

test('snapshot loading handles an owner with no remote snapshot', async () => {
  const fetcher: PersistenceFetch = async (_input, init) => {
    assert.equal(init?.method, 'GET');
    assert.equal(new Headers(init?.headers).get('Authorization'), 'Bearer user-access-token');
    return new Response(JSON.stringify({ snapshot: null }), { status: 200 });
  };
  assert.equal(await loadAlchemySnapshot('user-access-token', fetcher), null);
});

test('snapshot loading rejects malformed server data', async () => {
  const fetcher: PersistenceFetch = async () =>
    new Response(JSON.stringify({ snapshot: { revision: 0, schema_version: 1, payload: {} } }), { status: 200 });
  await assert.rejects(() => loadAlchemySnapshot('user-access-token', fetcher), /ongeldig of onvolledig/);
});

test('client persistence returns a safe error when the server rejects the request', async () => {
  const fetcher: PersistenceFetch = async () =>
    new Response(JSON.stringify({ error: 'Supabase persistence is not configured.' }), { status: 503 });
  await assert.rejects(
    () => loadAlchemySnapshot('user-access-token', fetcher),
    /Supabase persistence is not configured/,
  );
});
