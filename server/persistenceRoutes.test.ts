import test from 'node:test';
import assert from 'node:assert/strict';
import express from 'express';
import { createServer, type Server } from 'node:http';
import persistenceRouter from './persistenceRoutes';

async function withPersistenceServer(
  env: Record<string, string | undefined>,
  run: (baseUrl: string) => Promise<void>,
): Promise<void> {
  const original = {
    SUPABASE_URL: process.env.SUPABASE_URL,
    SUPABASE_ANON_KEY: process.env.SUPABASE_ANON_KEY,
    SUPABASE_SERVICE_ROLE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY,
  };
  for (const key of Object.keys(original) as (keyof typeof original)[]) {
    if (env[key] === undefined) delete process.env[key];
    else process.env[key] = env[key]!;
  }

  const app = express();
  app.use(express.json());
  app.use('/api/persistence', persistenceRouter);
  const server: Server = createServer(app);
  try {
    await new Promise<void>((resolve) => server.listen(0, '127.0.0.1', resolve));
    const address = server.address();
    if (!address || typeof address === 'string') throw new Error('Test server did not bind to a TCP port.');
    await run(`http://127.0.0.1:${address.port}`);
  } finally {
    await new Promise<void>((resolve, reject) => server.close((error) => error ? reject(error) : resolve()));
    for (const key of Object.keys(original) as (keyof typeof original)[]) {
      if (original[key] === undefined) delete process.env[key];
      else process.env[key] = original[key]!;
    }
  }
}

const configured = {
  SUPABASE_URL: 'https://example.supabase.co',
  SUPABASE_ANON_KEY: 'public-anon-key',
  SUPABASE_SERVICE_ROLE_KEY: 'server-only-service-role',
};

test('persistence routes fail closed when Supabase is not configured', async () => {
  await withPersistenceServer({}, async (baseUrl) => {
    const response = await fetch(`${baseUrl}/api/persistence/snapshot`);
    assert.equal(response.status, 503);
    assert.deepEqual(await response.json(), { error: 'Supabase persistence is not configured.' });
  });
});

test('persistence routes require a Supabase bearer token', async () => {
  await withPersistenceServer(configured, async (baseUrl) => {
    const response = await fetch(`${baseUrl}/api/persistence/snapshot`);
    assert.equal(response.status, 401);
    assert.deepEqual(await response.json(), { error: 'A Supabase access token is required.' });
  });
});

test('snapshot write route rejects malformed payloads before contacting Supabase', async () => {
  await withPersistenceServer(configured, async (baseUrl) => {
    const response = await fetch(`${baseUrl}/api/persistence/snapshot`, {
      method: 'POST',
      headers: { Authorization: 'Bearer test-token', 'Content-Type': 'application/json' },
      body: JSON.stringify({ payload: [] }),
    });
    assert.equal(response.status, 400);
    assert.deepEqual(await response.json(), { error: 'A valid Alchemy state object is required.' });
  });
});


test('persistence routes fail closed on malformed Supabase configuration', async () => {
  await withPersistenceServer({
    SUPABASE_URL: 'not-a-valid-url',
    SUPABASE_ANON_KEY: 'public-anon-key',
    SUPABASE_SERVICE_ROLE_KEY: 'server-only-service-role',
  }, async (baseUrl) => {
    for (const method of ['GET', 'POST'] as const) {
      const response = await fetch(`${baseUrl}/api/persistence/snapshot`, {
        method,
        headers: method === 'POST'
          ? { 'Content-Type': 'application/json', Authorization: 'Bearer test-token' }
          : {},
        body: method === 'POST' ? JSON.stringify({ payload: { tasks: [] } }) : undefined,
      });
      assert.equal(response.status, 503);
      assert.deepEqual(await response.json(), {
        error: 'Supabase persistence configuration is invalid.',
      });
    }
  });
});
