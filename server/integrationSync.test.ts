import test from 'node:test';
import assert from 'node:assert/strict';
import { resolveIntegrationSync } from './integrationSync';

test('unknown integration sync requests are rejected', () => {
  const result = resolveIntegrationSync('not-a-service', undefined);
  assert.equal(result.statusCode, 400);
  assert.equal(result.body.success, false);
});

test('disconnected integrations cannot report a successful sync', () => {
  for (const status of ['not_connected', 'disconnected', 'needs_attention', 'unavailable', undefined]) {
    const result = resolveIntegrationSync('calendar', status);
    assert.equal(result.statusCode, 409);
    assert.equal(result.body.success, false);
    assert.match(result.body.error, /No sync was performed/);
  }
});

test('connected integrations remain unverified until a real provider sync exists', () => {
  const result = resolveIntegrationSync('google_calendar', 'connected');
  assert.equal(result.statusCode, 501);
  assert.equal(result.body.success, false);
  assert.match(result.body.error, /No data was fetched/);
  assert.match(result.body.error, /no sync timestamp was recorded/);
});

test('health, Gmail and Instagram cannot report placeholder syncs as successful', () => {
  for (const service of ['health_connect', 'gmail', 'mariluna_gmail', 'instagram', 'mariluna_instagram']) {
    const result = resolveIntegrationSync(service, 'connected');
    assert.equal(result.statusCode, 501);
    assert.equal(result.body.success, false);
  }
});
