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

test('persistence routes keep cloud snapshots disabled until application encryption is ready', async () => {
  await withPersistenceServer(configured, async (baseUrl) => {
    const response = await fetch(`${baseUrl}/api/persistence/snapshot`);
    assert.equal(response.status, 503);
    assert.deepEqual(await response.json(), {
      error: 'Cloud snapshots are disabled until application-level encryption and key-rotation tests are complete.',
      code: 'snapshot_encryption_not_ready',
    });
  });
});


test('persistence routes never accept writes while cloud snapshot encryption is disabled', async () => {
  await withPersistenceServer(configured, async (baseUrl) => {
    for (const token of ['x'.repeat(8193), 'token with spaces']) {
      const response = await fetch(`${baseUrl}/api/persistence/snapshot`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      assert.equal(response.status, 503);
      assert.deepEqual(await response.json(), {
        error: 'Cloud snapshots are disabled until application-level encryption and key-rotation tests are complete.',
        code: 'snapshot_encryption_not_ready',
      });
    }
  });
});

test('snapshot write route remains locked even when a caller supplies a payload', async () => {
  await withPersistenceServer(configured, async (baseUrl) => {
    const response = await fetch(`${baseUrl}/api/persistence/snapshot`, {
      method: 'POST',
      headers: { Authorization: 'Bearer test-token', 'Content-Type': 'application/json' },
      body: JSON.stringify({ payload: [] }),
    });
    assert.equal(response.status, 503);
    assert.deepEqual(await response.json(), {
      error: 'Cloud snapshots are disabled until application-level encryption and key-rotation tests are complete.',
      code: 'snapshot_encryption_not_ready',
    });
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


test('snapshot write route cannot store incomplete or unencrypted state', async () => {
  await withPersistenceServer(configured, async (baseUrl) => {
    const response = await fetch(`${baseUrl}/api/persistence/snapshot`, {
      method: 'POST',
      headers: { Authorization: 'Bearer test-token', 'Content-Type': 'application/json' },
      body: JSON.stringify({ payload: { tasks: [], foundation: {}, integrations: {} } }),
    });
    assert.equal(response.status, 503);
    assert.deepEqual(await response.json(), {
      error: 'Cloud snapshots are disabled until application-level encryption and key-rotation tests are complete.',
      code: 'snapshot_encryption_not_ready',
    });
  });
});


test('snapshot write route remains locked regardless of supplied revision metadata', async () => {
  await withPersistenceServer(configured, async (baseUrl) => {
    const response = await fetch(`${baseUrl}/api/persistence/snapshot`, {
      method: 'POST',
      headers: { Authorization: 'Bearer test-token', 'Content-Type': 'application/json' },
      body: JSON.stringify({ payload: {
        tasks: [], goals: [], ideas: [], projects: [], calendarEvents: [], memories: [],
        dailyCheckIns: [], notifications: [], proactiveSuggestions: [], chatHistory: [],
        lifeProfile: {}, contentPlan: {}, personalStyle: {}, nutrition: {}, cycleProfile: {},
        wellbeing: {}, notificationSettings: {}, isSampleData: false, setupStatus: 'not_started',
        foundation: { aboutYou: {} }, integrations: { calendar: {}, gmail: {} },
      }, expectedRevision: -1 }),
    });
    assert.equal(response.status, 503);
    assert.deepEqual(await response.json(), {
      error: 'Cloud snapshots are disabled until application-level encryption and key-rotation tests are complete.',
      code: 'snapshot_encryption_not_ready',
    });
  });
});


test('cookie-authenticated app snapshot endpoints reject unauthenticated callers', async () => {
  await withPersistenceServer({}, async (baseUrl) => {
    const read = await fetch(`${baseUrl}/api/persistence/app-snapshot`);
    assert.equal(read.status, 401);
    const write = await fetch(`${baseUrl}/api/persistence/app-snapshot`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ payload: { tasks: [] } }),
    });
    assert.equal(write.status, 401);
  });
});
