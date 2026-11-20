import test from 'node:test';
import assert from 'node:assert/strict';
import { loadState, saveState, resetState, INITIAL_STATE } from './storage';

function installStorage(initial: Record<string, string> = {}) {
  const values = new Map(Object.entries(initial));
  const storage = {
    getItem(key: string) { return values.has(key) ? values.get(key)! : null; },
    setItem(key: string, value: string) { values.set(key, String(value)); },
    removeItem(key: string) { values.delete(key); },
    key(index: number) { return Array.from(values.keys())[index] ?? null; },
    get length() { return values.size; },
    values,
  };
  Object.defineProperty(globalThis, 'window', { configurable: true, value: {} });
  Object.defineProperty(globalThis, 'localStorage', { configurable: true, value: storage });
  return storage;
}

test('saveState returns true only after the browser storage write succeeds', () => {
  const storage = installStorage();
  assert.equal(saveState(INITIAL_STATE), true);
  assert.equal(storage.getItem('pm_alchemy_os_data_v1'), JSON.stringify(INITIAL_STATE));
});

test('saveState fails closed when browser storage rejects a write', () => {
  installStorage();
  Object.defineProperty(globalThis, 'localStorage', {
    configurable: true,
    value: { getItem: () => null, setItem: () => { throw new Error('QuotaExceededError'); } },
  });
  assert.equal(saveState(INITIAL_STATE), false);
});

test('loadState preserves malformed stored data in a recovery key before returning defaults', () => {
  const damaged = '{"tasks": [';
  const storage = installStorage({ pm_alchemy_os_data_v1: damaged });
  const loaded = loadState();
  assert.deepEqual(loaded.tasks, []);
  const recoveryEntries = Array.from(storage.values.entries())
    .filter(([key]) => key.startsWith('pm_alchemy_os_data_v1_recovery_'));
  assert.equal(recoveryEntries.length, 1);
  assert.equal(recoveryEntries[0][1], damaged);
});

test('loadState keeps legacy storage readable without deleting its original key', () => {
  const legacy = JSON.stringify({ ...INITIAL_STATE, foundation: INITIAL_STATE.foundation });
  const storage = installStorage({ mariluna_os_data_v1: legacy });
  const loaded = loadState();
  assert.deepEqual(loaded.tasks, INITIAL_STATE.tasks);
  assert.equal(storage.getItem('mariluna_os_data_v1'), legacy);
});


test('explicit reset clears both current and legacy storage keys', () => {
  const storage = installStorage({
    pm_alchemy_os_data_v1: JSON.stringify(INITIAL_STATE),
    mariluna_os_data_v1: JSON.stringify(INITIAL_STATE),
  });
  const reset = resetState();
  assert.deepEqual(reset.tasks, []);
  assert.equal(storage.getItem('pm_alchemy_os_data_v1'), null);
  assert.equal(storage.getItem('mariluna_os_data_v1'), null);
});

test('saveState refuses incomplete runtime payloads without overwriting the last good state', () => {
  const storage = installStorage();
  const valid = JSON.stringify(INITIAL_STATE);
  storage.setItem('pm_alchemy_os_data_v1', valid);
  const invalid = { ...INITIAL_STATE, chatHistory: undefined } as any;
  assert.equal(saveState(invalid), false);
  assert.equal(storage.getItem('pm_alchemy_os_data_v1'), valid);
});
