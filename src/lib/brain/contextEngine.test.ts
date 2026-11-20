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
    makeMemory({ id: 'legacy-learned', content: 'Legacy suggestion without status', realm: 'personal', type: 'learned', status: 'active' }),
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

test('memory confirmation only promotes pending learned suggestions', async () => {
  const { confirmLearnedMemory } = await import('./memoryEngine');
  const memories = [
    makeMemory({ id: 'pending', content: 'Candidate', realm: 'personal', type: 'learned', status: 'pending_confirmation' }),
    makeMemory({ id: 'archived', content: 'Archived', realm: 'personal', type: 'learned', status: 'archived' }),
    makeMemory({ id: 'explicit', content: 'Explicit', realm: 'personal', type: 'explicit', status: 'active' }),
  ];
  const result = confirmLearnedMemory(memories, 'archived');
  assert.equal(result.find((memory) => memory.id === 'archived')?.status, 'archived');
  assert.equal(result.find((memory) => memory.id === 'explicit')?.type, 'explicit');
  const confirmed = confirmLearnedMemory(result, 'pending');
  assert.equal(confirmed.find((memory) => memory.id === 'pending')?.type, 'confirmed');
});

test('memory dismissal only removes pending learned suggestions', async () => {
  const { dismissLearnedMemory } = await import('./memoryEngine');
  const memories = [
    makeMemory({ id: 'pending', content: 'Candidate', realm: 'personal', type: 'learned', status: 'pending_confirmation' }),
    makeMemory({ id: 'explicit', content: 'Explicit', realm: 'personal', type: 'explicit', status: 'active' }),
    makeMemory({ id: 'confirmed', content: 'Confirmed', realm: 'personal', type: 'confirmed', status: 'active' }),
  ];
  assert.deepEqual(
    dismissLearnedMemory(memories, 'explicit').map((memory) => memory.id),
    ['pending', 'explicit', 'confirmed'],
  );
  assert.deepEqual(
    dismissLearnedMemory(memories, 'pending').map((memory) => memory.id),
    ['explicit', 'confirmed'],
  );
});

test('memory edits cannot blank a memory or mutate an archived record', async () => {
  const { updateMemoryContent } = await import('./memoryEngine');
  const memories = [
    makeMemory({ id: 'active', content: 'Useful preference', realm: 'personal' }),
    makeMemory({ id: 'archived', content: 'Archived preference', realm: 'personal', status: 'archived' }),
  ];
  const blankEdit = updateMemoryContent(memories, 'active', '   ');
  assert.equal(blankEdit[0].content, 'Useful preference');
  const archivedEdit = updateMemoryContent(memories, 'archived', 'Changed text');
  assert.equal(archivedEdit[1].content, 'Archived preference');
  assert.equal(archivedEdit[1].status, 'archived');
  const validEdit = updateMemoryContent(memories, 'active', ' Updated preference ');
  assert.equal(validEdit[0].content, 'Updated preference');
});
