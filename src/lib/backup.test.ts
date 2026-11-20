import test from 'node:test';
import assert from 'node:assert/strict';
import { createAlchemyBackup, verifyAlchemyBackup, restoreAlchemyBackup } from './backup';
import { INITIAL_STATE } from './storage';

const minimalState = structuredClone(INITIAL_STATE);

test('Alchemy backup can be created and verified without changing its payload', async () => {
  const backup = await createAlchemyBackup(minimalState);
  const verified = await verifyAlchemyBackup(backup);
  assert.deepEqual(verified.payload, minimalState);
  assert.equal(verified.format, 'p-m-alchemy-backup');
  assert.equal(verified.checksumAlgorithm, 'SHA-256');
});

test('Alchemy backup verification rejects a modified payload', async () => {
  const backup = await createAlchemyBackup(minimalState);
  const modified = {
    ...backup,
    payload: { ...backup.payload, tasks: [{ id: 'tampered' }] },
  };
  await assert.rejects(() => verifyAlchemyBackup(modified), /integriteitscontrole is mislukt/);
});

test('Alchemy backup verification rejects unsupported formats and incomplete payloads', async () => {
  await assert.rejects(() => verifyAlchemyBackup({ format: 'other', backupVersion: 1 }), /geen ondersteunde/);
  const backup = await createAlchemyBackup(minimalState);
  await assert.rejects(() => verifyAlchemyBackup({
    ...backup,
    payload: { ...minimalState, tasks: undefined },
  }), /onvolledig/);
});


test('Alchemy backup verification rejects invalid schema versions and export dates', async () => {
  const backup = await createAlchemyBackup(minimalState);
  await assert.rejects(() => verifyAlchemyBackup({
    ...backup,
    appSchemaVersion: 0,
  }), /gegevensversie.*ongeldig/);
  await assert.rejects(() => verifyAlchemyBackup({
    ...backup,
    exportedAt: 'not-a-date',
  }), /exportdatum.*ongeldig/);
});


test('backup restore does not report success when local storage is unavailable', async () => {
  const backup = await createAlchemyBackup(minimalState);
  await assert.rejects(
    () => restoreAlchemyBackup(backup),
    /kon niet lokaal worden opgeslagen/,
  );
});


test('backup verification rejects backups from a newer app schema', async () => {
  const backup = await createAlchemyBackup(minimalState);
  await assert.rejects(() => verifyAlchemyBackup({
    ...backup,
    appSchemaVersion: backup.appSchemaVersion + 1,
  }), /nieuwere Alchemy-versie/);
});

test('backup verification rejects malformed integrity hashes before comparing payloads', async () => {
  const backup = await createAlchemyBackup(minimalState);
  await assert.rejects(() => verifyAlchemyBackup({
    ...backup,
    checksum: 'not-a-sha256-hash',
  }), /ongeldig formaat/);
});

test('backup verification requires the full Alchemy state contract', async () => {
  const backup = await createAlchemyBackup(minimalState);
  for (const payload of [
    { ...minimalState, chatHistory: undefined },
    { ...minimalState, nutrition: undefined },
    { ...minimalState, foundation: { ...minimalState.foundation, aboutYou: [] } },
    { ...minimalState, integrations: { ...minimalState.integrations, calendar: null } },
    { ...minimalState, setupStatus: 'unknown' },
  ]) {
    const malformed = { ...backup, payload, checksum: await (async () => {
      // Recreate a valid checksum so this test exercises schema validation, not tampering.
      const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(JSON.stringify(payload)));
      return Array.from(new Uint8Array(digest), (byte) => byte.toString(16).padStart(2, '0')).join('');
    })() };
    await assert.rejects(() => verifyAlchemyBackup(malformed), /onvolledig|ongeldig/);
  }
});
