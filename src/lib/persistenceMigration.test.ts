import test from 'node:test';
import assert from 'node:assert/strict';
import { INITIAL_STATE, SAMPLE_STATE } from './storage';
import { planPersistenceMigration } from './persistenceMigration';
import type { AlchemySnapshot } from './persistenceClient';

const remote: AlchemySnapshot = {
  id: 'd4f1c1a2-1234-4a5b-9c8d-1234567890ab',
  owner_id: 'a4f1c1a2-1234-4a5b-9c8d-1234567890ab',
  schema_version: 1,
  revision: 7,
  payload: { ...INITIAL_STATE, tasks: [{ id: 'remote-task' }] },
  payload_sha256: 'a'.repeat(64),
  source: 'autosave',
  created_at: '2026-11-18T12:00:00.000Z',
};

test('migration planner reports a clean first start without a confirmation step', () => {
  const plan = planPersistenceMigration(INITIAL_STATE, null);
  assert.equal(plan.action, 'fresh_start');
  assert.equal(plan.requiresExplicitChoice, false);
  assert.equal(plan.localRecordCount, 0);
  assert.equal(plan.remoteRevision, null);
});


test('migration planner counts completed identity setup even when collections are empty', () => {
  const profileOnly = {
    ...INITIAL_STATE,
    foundation: {
      ...INITIAL_STATE.foundation,
      isCompleted: true,
      aboutYou: { ...INITIAL_STATE.foundation.aboutYou, name: 'Patricia' },
    },
  };
  const plan = planPersistenceMigration(profileOnly, null);
  assert.equal(plan.action, 'upload_local_after_confirmation');
  assert.ok(plan.localRecordCount >= 2);
});

test('migration planner counts nested Mariluna finance records', () => {
  const marilunaOnly = {
    ...INITIAL_STATE,
    marilunaAdmin: {
      items: [],
      expenses: [{ id: 'expense-1' }],
      invoices: [],
      deadlines: [],
    },
  };
  const plan = planPersistenceMigration(marilunaOnly, null);
  assert.equal(plan.action, 'upload_local_after_confirmation');
  assert.equal(plan.localRecordCount, 1);
});

test('migration planner asks before uploading local-only data', () => {
  const plan = planPersistenceMigration(SAMPLE_STATE, null);
  assert.equal(plan.action, 'upload_local_after_confirmation');
  assert.equal(plan.requiresExplicitChoice, true);
  assert.ok(plan.localRecordCount > 0);
});

test('migration planner asks before restoring remote-only data', () => {
  const plan = planPersistenceMigration(INITIAL_STATE, remote);
  assert.equal(plan.action, 'restore_remote_after_confirmation');
  assert.equal(plan.requiresExplicitChoice, true);
  assert.equal(plan.remoteRevision, 7);
  assert.equal(plan.remoteRecordCount, 1);
});

test('migration planner never silently picks a winner when both sides contain data', () => {
  const plan = planPersistenceMigration(SAMPLE_STATE, remote);
  assert.equal(plan.action, 'resolve_local_remote_conflict');
  assert.equal(plan.requiresExplicitChoice, true);
  assert.ok(plan.localRecordCount > 0);
  assert.equal(plan.remoteRecordCount, 1);
  assert.match(plan.explanation, /niets automatisch overschreven/);
});
