import test from 'node:test';
import assert from 'node:assert/strict';
import { buildBrainContext } from './contextEngine';
import { INITIAL_STATE } from '../storage';
import { MemoryItem } from '../../types';

function makeMemory(overrides: Partial<MemoryItem> & Pick<MemoryItem, 'id' | 'content' | 'realm'>): MemoryItem {
  return {
    category: 'Planning',
    dateAdded: '2026-11-19',
    importance: 'medium',
    source: 'user_stated',
    type: 'explicit',
    confidence: 'high',
    status: 'active',
    ...overrides,
  };
}

test('Jarvis context excludes pending, archived, expired and malformed-expiry memories', () => {
  const state = structuredClone(INITIAL_STATE);
  state.memories = [
    makeMemory({ id: 'active', content: 'Keep plans realistic', realm: 'personal' }),
    makeMemory({ id: 'pending', content: 'Unconfirmed preference', realm: 'personal', type: 'learned', status: 'pending_confirmation' }),
    makeMemory({ id: 'archived', content: 'Old preference', realm: 'personal', status: 'archived' }),
    makeMemory({ id: 'expired', content: 'Expired preference', realm: 'personal', expiresAt: '2020-01-01T00:00:00.000Z' }),
    makeMemory({ id: 'malformed', content: 'Invalid expiry preference', realm: 'personal', expiresAt: 'not-a-date' }),
    makeMemory({ id: 'future', content: 'Temporary future preference', realm: 'personal', expiresAt: new Date(Date.now() + 60_000).toISOString() }),
  ];

  const result = buildBrainContext(state, 'personal');
  assert.deepEqual(result.relevantMemories.map((memory) => memory.id), ['active', 'future']);
});

test('Jarvis context never mixes personal and Mariluna memories across workspaces', () => {
  const state = structuredClone(INITIAL_STATE);
  state.memories = [
    makeMemory({ id: 'private', content: 'Private preference', realm: 'personal' }),
    makeMemory({ id: 'business', content: 'Mariluna brand voice', realm: 'mariluna' }),
    { ...makeMemory({ id: 'unscoped', content: 'Unscoped memory', realm: 'personal' }), realm: undefined as any },
  ];

  assert.deepEqual(buildBrainContext(state, 'personal').relevantMemories.map((memory) => memory.id), ['private']);
  assert.deepEqual(buildBrainContext(state, 'mariluna').relevantMemories.map((memory) => memory.id), ['business']);
  assert.deepEqual(
    buildBrainContext(state, 'balanced').relevantMemories.map((memory) => memory.id).sort(),
    ['business', 'private'],
  );
});
